import * as pg from 'pg';
import { BaseConfig } from './config';
export declare class Db {
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
