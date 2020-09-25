
import * as util from './util';
import { Log } from './log';

export enum LOG_LEVELS {
  error = 0,
  warning = 1,
  info = 2,
  access = 3,
  debug = 4,
}

export type CmdLineOpts = { [name: string]: string | boolean };

type Defaults = {
  APP_NAME?: string;
  LOG_LEVEL?: LOG_LEVELS;
  LOG_DIRECTORY?: string;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_NAME?: string;
  DB_USER?: string;
  DB_CERTS_PATH?: string;
  DB_INSECURE?: boolean;
};

export class Config {

  ['constructor']: typeof Config; // this is for TS to be happy https://github.com/Microsoft/TypeScript/issues/3841#issuecomment-337560146

  APP_NAME = 'test_app';
  LOG_LEVEL = LOG_LEVELS.info;
  LOG_DIRECTORY = '';
  DB_HOST = 'localhost';
  DB_PORT = 26257;
  DB_NAME = 'db_test';
  DB_USER = 'user_test';
  DB_CERTS_PATH = 'certs';
  DB_INSECURE = false;

  private log?: Log;

  private KEYS_CONFIGURABLE = [
    'LOG_LEVEL', 'LOG_DIRECTORY',
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_CERTS_PATH', 'DB_INSECURE',
  ];

  constructor(defaults: Defaults) {
    for (let name of Object.keys(process.env)) {
      if (this.KEYS_CONFIGURABLE.indexOf(name) !== -1) {
        this.setOpt(name, process.env[name]!);
      }
    }
    for (let name of Object.keys(defaults)) {
      // @ts-ignore
      let v = defaults[name];
      this.setOpt(name, v);
    }
  }

  static requiredEnv(optName: string): string {
    const str = process.env[optName];
    if (!str) {
      throw new Error(`Missing required ENV var: ${optName}`);
    }
    return str;
  }

  setCmdLineOpts = (cmdLineOpts: CmdLineOpts) => {
    for (let name of Object.keys(cmdLineOpts)) {
      this.setOpt(name, cmdLineOpts[name]);
    }
    let formatConfigLine = (k: string) => `Config ${k}=${String((this as any)[k])}`;
    this.log = new Log(this);
    this.log.debug(this.KEYS_CONFIGURABLE.map(formatConfigLine).join('\n'));
  }

  isConfigurable = (optName: string) => {
    return this.KEYS_CONFIGURABLE.indexOf(this.envVarFormat(optName)) !== -1;
  }

  listConfigurable = (cmdLine = false) => {
    if (cmdLine) {
      return this.KEYS_CONFIGURABLE.map(this.cmd_line_format);
    }
    return this.KEYS_CONFIGURABLE;
  }

  getApiPort = (cmdLinePort: string | undefined, defaultPort: number): number => {
    if (cmdLinePort) {
      if (isNaN(Number(cmdLinePort))) {
        throw new Error(`Specified port is not a number: ${cmdLinePort}`);
      }
      return Number(cmdLinePort);
    } else if (process.env.PORT) {
      if (isNaN(Number(process.env.PORT))) {
        throw new Error(`Specified env PORT is not a number: ${process.env.PORT}`);
      }
      return Number(process.env.PORT);
    } else {
      return defaultPort;
    }
  }

  private exitIfMissingFile = async (file: string, files: string[]) => {
    if (files.indexOf(file) === -1) {
      await this.log!.error(`Missing a cert needed for secure db mode: ${this.DB_CERTS_PATH}/${file}\nadjust path with --db-certs-path=folder, run with --db-insecure or make sure the file is present`, true);
    }
  }

  public validate = async (cmdNeedsDb: boolean) => {
    if (cmdNeedsDb) {
      if (!this.DB_INSECURE && !this.DB_CERTS_PATH) {
        await this.log!.error('Certs path is required when running in secure db mode\neither run with --db-insecure or --db-certs-path=folder', true);
      }
      if (!this.DB_INSECURE) {
        try {
          let files = await util.readDir(this.DB_CERTS_PATH);
          await this.exitIfMissingFile('ca.crt', files);
          await this.exitIfMissingFile(`client.${this.DB_USER}.key`, files);
          await this.exitIfMissingFile(`client.${this.DB_USER}.crt`, files);
        } catch (e) {
          await this.log!.error(`cannot access certs directory: ${e.message}\nadjust path with --db-certs-path=folder or run with --db-insecure`, true);
        }
      }
    }
  }

  private cmd_line_format = (optName: string) => {
    return optName.toLowerCase().replace(/_/g, '-');
  }

  private envVarFormat = (optName: string) => {
    return optName.toUpperCase().replace(/-/g, '_');
  }

  private rmTrailingSlash = (path: string) => {
    return path.replace(/\/$/, '');
  }

  private setOpt = (name: string, value: string | boolean) => {
    name = name.toUpperCase().replace(/-/g, '_');
    if (name === 'APP_NAME') {
      this.APP_NAME = String(value);
    } else if (name === 'DB_HOST') {
      this.DB_HOST = String(value);
    } else if (name === 'DB_PORT') {
      let n = Number(value);
      if (isNaN(n)) {
        throw new Error(`DB_PORT: not a number (${value})`);
      }
      this.DB_PORT = Number(value);
    } else if (name === 'DB_NAME') {
      this.DB_NAME = String(value);
    } else if (name === 'DB_USER') {
      this.DB_USER = String(value);
    } else if (name === 'DB_CERTS_PATH') {
      this.DB_CERTS_PATH = this.rmTrailingSlash(String(value));
    } else if (name === 'DB_INSECURE') {
      this.DB_INSECURE = Boolean(value);
    } else if (name === 'LOG_DIRECTORY') {
      this.LOG_DIRECTORY = this.rmTrailingSlash(String(value));
    } else if (name === 'LOG_LEVEL') {
      if (value === 'error' || value === 'warning' || value === 'info' || value === 'access' || value === 'debug') {
        value = String(LOG_LEVELS[value]);
      }
      let n = Number(value);
      if (isNaN(n) && n >= 0 && n <= 4) {
        throw new Error(`LOG_LEVEL: should be a number 0-4, got (${value})`);
      }
      this.LOG_LEVEL = n as LOG_LEVELS;
    } else {
      throw new Error(`Unknown config variable: ${name}`);
    }
  }

}
