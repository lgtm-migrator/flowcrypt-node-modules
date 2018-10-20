import * as pg from 'pg';
import { BaseConfig } from './config';
declare type DbValue = string | boolean | number | null;
export declare class Db {
    sql: SqlBuilder;
    private pool;
    private log;
    private SERIALIZATION_FAILURE_RETRIES;
    private ERRCODE_SERIALIZATION_FAILURE;
    private ERRCODE_DUPLICTE_KEY_VIOLATION;
    constructor(config: BaseConfig);
    connection: () => Promise<pg.PoolClient>;
    read: (query_f: (conn: pg.PoolClient) => Promise<any>) => Promise<any>;
    write: (tx_f: (conn: pg.PoolClient) => Promise<any>, retries?: number) => Promise<any>;
}
declare class SqlBuilder {
    static insert: (table: string, columns: string, sql_pattern: string, array_of_value_arrays: DbValue[][], add?: string) => pg.QueryConfig;
    static prepare: (sql: string, fill_values: (string | number | boolean | DbValue[] | null)[]) => pg.QueryConfig;
    static on_conflict: (column: string, update_columns: string[], where?: string | undefined) => string;
}
export {};
