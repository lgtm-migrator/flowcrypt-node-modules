
import {BaseConfig} from './config';
import {Db} from './db';
import {Log} from './log';

export class Context {

  db: Db;
  log: Log;
  config: BaseConfig;

  constructor(config: BaseConfig, log: Log, db: Db) {
    this.config = config;
    this.log = log;
    this.db = db;
  }

}
