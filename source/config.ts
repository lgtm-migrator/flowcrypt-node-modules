
import * as util from './util';
import { Log } from './log';

export enum LOG_LEVELS {
  error = 0,
  warning = 1,
  info = 2,
  access = 3,
  debug = 4,
}

export type CommandLineOptions = { [name: string]: string };

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
  DB_HOST = '127.0.0.1';
  DB_PORT = 26257;
  DB_NAME = 'db_test';
  DB_USER = 'user_test';
  DB_CERTS_PATH = 'certs';
  DB_INSECURE = false;

  private log: Log;

  private KEYS_CONFIGURABLE = [
    'LOG_LEVEL', 'LOG_DIRECTORY',
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_CERTS_PATH', 'DB_INSECURE',
  ];

  constructor(defaults: Defaults) {
    for (let name of Object.keys(process.env)) {
      if (this.KEYS_CONFIGURABLE.indexOf(name) !== -1) {
        this.set_option(name, process.env[name]!);
      }
    }
    for (let name of Object.keys(defaults)) {
      // @ts-ignore
      let v = defaults[name];
      this.set_option(name, v);
    }
  }

  set_cmd_line_options = (cmd_line_options: CommandLineOptions) => {
    for (let name of Object.keys(cmd_line_options)) {
      this.set_option(name, cmd_line_options[name]);
    }
    // @ts-ignore
    let format_config_line = (k: string) => `Config ${k}=${String(this[k])}`;
    this.log = new Log(this);
    this.log.debug(this.KEYS_CONFIGURABLE.map(format_config_line).join('\n'));
  }

  is_configurable = (option_name: string) => {
    return this.KEYS_CONFIGURABLE.indexOf(this.env_var_format(option_name)) !== -1;
  }

  list_configurable = (cmd_line = false) => {
    if (cmd_line) {
      return this.KEYS_CONFIGURABLE.map(this.cmd_line_format);
    }
    return this.KEYS_CONFIGURABLE;
  }

  get_api_port = (cmd_line_port: string | undefined, defaultPort: number): number => {
    if (cmd_line_port) {
      if (isNaN(Number(cmd_line_port))) {
        throw new Error(`Specified port is not a number: ${cmd_line_port}`);
      }
      return Number(cmd_line_port);
    } else if (process.env.PORT) {
      if (isNaN(Number(process.env.PORT))) {
        throw new Error(`Specified env PORT is not a number: ${process.env.PORT}`);
      }
      return Number(process.env.PORT);
    } else {
      return defaultPort;
    }
  }

  private exit_if_missing_file = async (file: string, files: string[]) => {
    if (files.indexOf(file) === -1) {
      await this.log.error(`Missing a cert needed for secure db mode: ${this.DB_CERTS_PATH}/${file}\nadjust path with --db-certs-path=folder, run with --db-insecure or make sure the file is present`, true);
    }
  }

  public validate = async () => {
    if (!this.DB_INSECURE && !this.DB_CERTS_PATH) {
      await this.log.error('Certs path is required when running in secure db mode\neither run with --db-insecure or --db-certs-path=folder', true);
    }
    if (!this.DB_INSECURE) {
      try {
        let files = await util.read_dir(this.DB_CERTS_PATH);
        await this.exit_if_missing_file('ca.crt', files);
        await this.exit_if_missing_file(`client.${this.DB_USER}.key`, files);
        await this.exit_if_missing_file(`client.${this.DB_USER}.crt`, files);
      } catch (e) {
        await this.log.error(`cannot access certs directory: ${e.message}\nadjust path with --db-certs-path=folder or run with --db-insecure`, true);
      }
    }
  }

  private cmd_line_format = (option_name: string) => {
    return option_name.toLowerCase().replace(/_/g, '-');
  }

  private env_var_format = (option_name: string) => {
    return option_name.toUpperCase().replace(/-/g, '_');
  }

  private remove_trailing_slash = (path: string) => {
    return path.replace(/\/$/, '');
  }

  private set_option = (name: string, value: string) => {
    name = name.toUpperCase().replace(/-/g, '_');
    if (name === 'APP_NAME') {
      this.APP_NAME = value;
    } else if (name === 'DB_HOST') {
      this.DB_HOST = value;
    } else if (name === 'DB_PORT') {
      let n = Number(value);
      if (isNaN(n)) {
        throw new Error(`DB_PORT: not a number (${value})`);
      }
      this.DB_PORT = Number(value);
    } else if (name === 'DB_NAME') {
      this.DB_NAME = value;
    } else if (name === 'DB_USER') {
      this.DB_USER = value;
    } else if (name === 'DB_CERTS_PATH') {
      this.DB_CERTS_PATH = this.remove_trailing_slash(value);
    } else if (name === 'DB_INSECURE') {
      this.DB_INSECURE = Boolean(value);
    } else if (name === 'LOG_DIRECTORY') {
      this.LOG_DIRECTORY = this.remove_trailing_slash(value);
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
