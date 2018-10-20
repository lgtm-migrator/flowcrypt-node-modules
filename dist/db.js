"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg = require("pg");
const util = require("./util");
const log_1 = require("./log");
const fs_1 = require("fs");
class Db {
    constructor(config) {
        this.SERIALIZATION_FAILURE_RETRIES = 20;
        this.ERRCODE_SERIALIZATION_FAILURE = '40001';
        this.ERRCODE_DUPLICTE_KEY_VIOLATION = '23505';
        this.connection = () => this.pool.connect();
        this.read = async (query_f) => {
            let c = await this.connection();
            let r = await query_f(c);
            await c.release();
            return r;
        };
        this.write = async (tx_f, retries = this.SERIALIZATION_FAILURE_RETRIES) => {
            let c = await this.connection();
            await c.query('BEGIN; SAVEPOINT cockroach_restart');
            try {
                while (true) {
                    try {
                        if (retries < this.SERIALIZATION_FAILURE_RETRIES) { // not the first try
                            await util.wait(Math.round(Math.random() * 100)); // wait up to 100ms
                        }
                        let result = await tx_f(c);
                        await c.query('RELEASE SAVEPOINT cockroach_restart; COMMIT');
                        return result;
                    }
                    catch (e) {
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
            }
            catch (e) {
                await c.query('ROLLBACK'); // rollback if throwing upstream
                throw e;
            }
            finally {
                await c.release();
            }
        };
        this.log = new log_1.Log(config);
        this.pool = new pg.Pool({
            user: config.DB_USER,
            host: config.DB_HOST,
            database: config.DB_NAME,
            port: config.DB_PORT,
            min: 1,
            max: 100,
            ssl: config.DB_INSECURE ? undefined : {
                rejectUnauthorized: false,
                requestCert: true,
                ca: fs_1.readFileSync(`${config.DB_CERTS_PATH}/ca.crt`).toString(),
                key: fs_1.readFileSync(`${config.DB_CERTS_PATH}/client.${config.DB_USER}.key`).toString(),
                cert: fs_1.readFileSync(`${config.DB_CERTS_PATH}/client.${config.DB_USER}.crt`).toString(),
            },
        });
    }
}
exports.Db = Db;
class Sql {
}
Sql.insert = (table, columns, sql_pattern, array_of_value_arrays, add = '') => {
    columns = `"${columns.split(',').join('","')}"`;
    let values = [];
    let rows = [];
    let i = 1;
    for (let value_array of array_of_value_arrays) {
        rows.push(sql_pattern.replace(/\$\$/g, placeholder => `$${i++}`));
        values.push.apply(values, value_array);
    }
    let text = `INSERT INTO ${table}(${columns}) VALUES (${rows.join('),(')}) ${add};`;
    return { text, values };
};
Sql.prepare = (sql, fill_values) => {
    let i = 1;
    let fill_values_i = 0;
    let values = [];
    let text = sql.replace(/\$\$\$?/g, placeholder => {
        if (placeholder === '$$$') {
            values.push.apply(values, fill_values[fill_values_i++]);
            return values.map(v => `$${i++}`).join(',');
        }
        else {
            values.push(fill_values[fill_values_i++]);
            return `$${i++}`;
        }
    });
    return { text, values };
};
Sql.on_conflict = (column, update_columns, where) => {
    return `ON CONFLICT (${column}) DO UPDATE SET ${update_columns.map(c => `${c} = excluded.${c}`).join(',')} WHERE ${where || 'TRUE'}`;
};
//# sourceMappingURL=db.js.map