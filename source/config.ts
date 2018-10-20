
import * as util from './util';
import { Log } from './log';

export enum LOG_LEVELS {
  error = 0,
  warning = 1,
  info = 2,
  access = 3,
  debug = 4,
}

export type CommandLineOptions = {[name: string]: string};

export class Config {

  LOG_LEVEL = LOG_LEVELS.info;
  LOG_DIRECTORY = '';
  DB_HOST = '127.0.0.1';
  DB_PORT = 26257;
  DB_NAME = 'db_test';
  DB_USER = 'user_test';
  DB_CERTS_PATH = 'certs';
  DB_INSECURE = false;

  private log: Log;

  private static KEYS_CONFIGURABLE = [
    'LOG_LEVEL', 'LOG_DIRECTORY',
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_CERTS_PATH', 'DB_INSECURE',
  ];

  constructor(cmd_line_options: CommandLineOptions) {
    for(let name of Object.keys(process.env)) {
      if(Config.KEYS_CONFIGURABLE.indexOf(name) !== -1) {
        this.set_option(name, process.env[name]!);
      }
    }
    for(let name of Object.keys(cmd_line_options)) {
      this.set_option(name, cmd_line_options[name]);
    }
    // @ts-ignore
    let format_config_line = (k: string) => `Config ${k}=${this[k] as string}`;
    this.log = new Log(this);
    this.log.debug(Config.KEYS_CONFIGURABLE.map(format_config_line).join('\n'));
  }

  static is_configurable = (option_name: string) => {
    return Config.KEYS_CONFIGURABLE.indexOf(Config.env_var_format(option_name)) !== -1;
  }

  static list_configurable = (cmd_line=false) => {
    if(cmd_line) {
      return Config.KEYS_CONFIGURABLE.map(Config.cmd_line_format);
    }
    return Config.KEYS_CONFIGURABLE;
  }

  static get_api_port = (cmd_line_port: string|undefined): number => {
    if(cmd_line_port) {
      if(isNaN(Number(cmd_line_port))) {
        throw new Error(`Specified port is not a number: ${cmd_line_port}`);
      }
      return Number(cmd_line_port);
    } else if(process.env.PORT) {
      if(isNaN(Number(process.env.PORT))) {
        throw new Error(`Specified env PORT is not a number: ${process.env.PORT}`);
      }
      return Number(process.env.PORT);
    } else {
      return 5006;
    }
  }

  validate = async () => {
    if(!this.DB_INSECURE && !this.DB_CERTS_PATH) {
      await this.log.error('Certs path is required when running in secure db mode\neither run with --db-insecure or --db-certs-path=folder', true);
    }
    if(!this.DB_INSECURE) {
      try {
        let files = await util.read_dir(this.DB_CERTS_PATH);
        for(let file of files) {
          await this.log.error(`Missing a cert needed for secure db mode: ${this.DB_CERTS_PATH}/${file}\nadjust path with --db-certs-path=folder, run with --db-insecure or make sure the file is present`, true);
        }
      } catch (e) {
        await this.log.error(`cannot access certs directory: ${e.message}\nadjust path with --db-certs-path=folder or run with --db-insecure`, true);
      }
    }
  }

  private static cmd_line_format = (option_name: string) => {
    return option_name.toLowerCase().replace(/_/g, '-');
  }

  private static env_var_format = (option_name: string) => {
    return option_name.toUpperCase().replace(/-/g, '_');
  }

  private set_option = (name: string, value: string) => {
    name = name.toUpperCase().replace(/-/g, '_');
    if(name === 'DB_HOST') {
      this.DB_HOST = value;
    } else if (name === 'DB_PORT') {
      let n = Number(value);
      if(isNaN(n)) {
        throw new Error(`DB_PORT: not a number (${value})`);
      }
      this.DB_PORT = Number(value);
    } else if (name === 'DB_NAME') {
      this.DB_NAME = value;
    } else if (name === 'DB_USER') {
      this.DB_USER = value;
    } else if (name === 'DB_CERTS_PATH') {
      this.DB_CERTS_PATH = value;
    } else if (name === 'DB_INSECURE') {
      this.DB_INSECURE = Boolean(value);
    } else if (name === 'LOG_DIRECTORY') {
      this.LOG_DIRECTORY = value;
    } else if (name === 'LOG_LEVEL') {
      let n = Number(value);
      if(isNaN(n) && n >= 0 && n <= 4) {
        throw new Error(`LOG_LEVEL: should be a number 0-4, got (${value})`);
      }
      this.LOG_LEVEL = n as LOG_LEVELS;
    } else {
      throw new Error(`Unknown config variable: ${name}`);
    }
  }

}
