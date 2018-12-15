
import { Config } from './config';
import { Db } from './db';
import { Log } from './log';

export class Context {

  db: Db;
  log: Log;
  config: Config;

  constructor(config: Config, log: Log, db: Db | undefined) {
    this.config = config;
    this.log = log;
    if (db) {
      this.db = db;
    }
  }

}
