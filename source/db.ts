
import * as pg from 'pg';
import * as util from './util';
import { Log } from './log';
import { Config } from './config';
import { readFileSync } from 'fs';

export type DbValue = string | boolean | number | Buffer | null;

export type Querier = (query: string | pg.QueryConfig, values?: any[]) => Promise<any[]>;

export class Db {

  public sql: SqlBuilder;

  private pool: pg.Pool;
  private log: Log;

  private SERIALIZATION_FAILURE_RETRIES = 20;
  private ERRCODE_SERIALIZATION_FAILURE = '40001';
  // private ERRCODE_DUPLICTE_KEY_VIOLATION = '23505';

  constructor(config: Config) {
    this.log = new Log(config);
    this.sql = new SqlBuilder(this.log);
    this.log.debug('creating db pool');
    this.pool = new pg.Pool({
      user: config.DB_USER,
      host: config.DB_HOST,
      database: config.DB_NAME,
      port: config.DB_PORT,
      min: 1,
      max: 100,
      ssl: config.DB_INSECURE ? undefined : {
        rejectUnauthorized: true,
        // todo - causes "Error: Unexpected db host: localhost, expected: 94.237.87.183"
        // this seems to look at just the first mentioned host in the cert, which is always localhost
        // we could rotate our roach certs with setup that has the IP first
        // before that, this will have to stay disabled
        // checkServerIdentity: (host, cert) => host !== config.DB_HOST ? new Error(`Unexpected db host: ${host}, expected: ${config.DB_HOST}`) : undefined,
        ca: readFileSync(`${config.DB_CERTS_PATH}/ca.crt`).toString(),
        key: readFileSync(`${config.DB_CERTS_PATH}/client.${config.DB_USER}.key`).toString(),
        cert: readFileSync(`${config.DB_CERTS_PATH}/client.${config.DB_USER}.crt`).toString(),
      },
    });
    this.log.debug('db pool created');
  }

  connection = async () => {
    // this.log.debug('grabbing connection from the pool');
    let c = await this.pool.connect();
    // this.log.debug('got connection from the pool');
    return c;
  }

  read = async <T>(f: (query: Querier) => Promise<T>): Promise<T> => {
    let c = await this.connection();
    let r = await f(this.getConnQuerier(c));
    await c.release();
    return r;
  }

  write = async <T>(txFunction: (query: Querier) => Promise<T>, retries = this.SERIALIZATION_FAILURE_RETRIES): Promise<T> => {
    let c = await this.connection();
    await c.query('BEGIN; SAVEPOINT cockroach_restart');
    try {
      while (true) {
        try {
          if (retries < this.SERIALIZATION_FAILURE_RETRIES) { // not the first try
            await util.wait(Math.round(Math.random() * 100)); // wait up to 100ms
          }
          let result = await txFunction(this.getConnQuerier(c));
          await c.query('RELEASE SAVEPOINT cockroach_restart; COMMIT');
          return result;
        } catch (e) {
          retries -= 1;
          if (e.code !== this.ERRCODE_SERIALIZATION_FAILURE) {
            throw e;
          }
          if (retries <= 0) {
            this.log.error('will not retry db tx anymore - ran out of retries');
            throw e;
          }
          this.log.debug('retrying a db transaction');
          await c.query('ROLLBACK TO SAVEPOINT cockroach_restart'); // Signal to the database that we'll retry
        }
      }
    } catch (e) {
      await c.query('ROLLBACK');  // rollback if throwing upstream
      throw e;
    } finally {
      await c.release();
    }
  }

  private getConnQuerier = (c: pg.PoolClient): Querier => {
    return async (query, values) => {
      let preparedQuery = (typeof query === 'string' && values) ? this.sql.prepare(query, values) : query;
      let loggableQuery = typeof preparedQuery === 'string' ? preparedQuery : preparedQuery.text;
      let debuggableVals = typeof preparedQuery === 'string' ? values : preparedQuery.values;
      try {
        // await this.log.debug(`[SQL]${JSON.stringify(preparedQuery, undefined, 2)}[/SQL]`); // full debug
        let { rows } = await c.query(preparedQuery);
        await this.log.debug(`SQL[${loggableQuery}]`);
        return rows;
      } catch (e) {
        if (e instanceof Error && e.message && (e.message.indexOf('syntax error') === 0 || e.message.indexOf('null value in column') === 0)) {
          await this.log.error(`error: ${loggableQuery}`);
          await this.log.debug(`error: ${JSON.stringify(debuggableVals)}`);
        }
        throw e;
      }
    };
  }

}

class SqlBuilder {

  private log: Log;

  constructor(log: Log) {
    this.log = log;
  }

  public insert = (table: string, columns: string, sqlPattern: string, arrOfValArrs: DbValue[][], add: string = ''): pg.QueryConfig => {
    columns = `"${columns.split(',').join('","')}"`;
    let values: DbValue[] = [];
    let rows: string[] = [];
    let i = 1;
    for (let value_array of arrOfValArrs) {
      rows.push(sqlPattern.replace(/\$\$/g, placeholder => `$${i++}`));
      values.push.apply(values, value_array);
    }
    let text = `INSERT INTO ${table}(${columns}) VALUES (${rows.join('),(')}) ${add};`;
    return { text, values };
  }

  public prepare = (sql: string, fillVals: (DbValue | DbValue[])[]): pg.QueryConfig => {
    let i = 1;
    let fillValsCounter = 0;
    let values: DbValue[] = [];
    let fillers = fillVals.length;
    let placeholders = 0;
    let text = sql.replace(/\$\$\$?/g, placeholder => {
      placeholders++;
      const fillVal = fillVals[fillValsCounter++];
      if (placeholder === '$$$' && Array.isArray(fillVal)) {
        values.push(...fillVal);
        return fillVal.map(v => `$${i++}`).join(',');
      } else if (!Array.isArray(fillVal)) {
        values.push(fillVal);
        return `$${i++}`;
      } else {
        throw new Error(`Placeholder(${placeholder}) does not match value type (${String(fillVal)})`);
      }
    });
    if (fillers !== placeholders) {
      this.log.error(`Following query with ${placeholders} placeholders was provided ${fillers} fillers:\n${sql}`);
      throw new Error(`Query with ${placeholders} placeholders was provided ${fillers} fillers`);
    }
    return { text, values };
  }

  public onConflict = (column: string, updateCols: string[], where?: string): string => {
    return `ON CONFLICT (${column}) DO UPDATE SET ${updateCols.map(c => `${c} = excluded.${c}`).join(',')} WHERE ${where || 'TRUE'}`;
  }

  public date = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

}
