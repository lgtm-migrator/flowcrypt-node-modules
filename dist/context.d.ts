import { BaseConfig } from './config';
import { Db } from './db';
import { Log } from './log';
export declare class Context {
    db: Db;
    log: Log;
    config: BaseConfig;
    constructor(config: BaseConfig, log: Log, db: Db);
}
