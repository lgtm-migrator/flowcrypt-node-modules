
import {BaseConfig, LOG_LEVELS} from './config';
import {append_file} from './util';

export class Log {

  LOG_FILE: string|null;
  LOG_LEVEL: LOG_LEVELS;
  LOG_PREFIX: {error: string, warning: string, info: string, access: string, debug: string};

  constructor(config: BaseConfig) {
    this.LOG_FILE = config.LOG_DIRECTORY ? `${config.LOG_DIRECTORY}/${config.APP_NAME}` : null;
    this.LOG_LEVEL = config.LOG_LEVEL;
    this.LOG_PREFIX = {
      error: `${config.APP_NAME.toUpperCase()}_ERROR`,
      warning: `${config.APP_NAME.toUpperCase()}_WARNING`,
      info: `${config.APP_NAME.toUpperCase()}_INFO`,
      access: '',
      debug: '',
    };
  }

  static _fatal = (message: string) => {
    message = Log.prefix_text(message, 'ERROR');
    console.log(message);
    process.exit(1);
  }

  fatal = Log._fatal;

  exception = async (e: Error, details?: string, exit=false) => {
    let as_string = String(e);
    if(e instanceof Error && e.stack) {
      as_string += `\n${Log.prefix_text(e.stack, 'stack')}`;
    }
    if(details) {
      as_string += Log.prefix_text(details, 'details');
    }
    await this.error(as_string, exit);
  }

  error = async (message: string, exit=false) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.error, this.LOG_PREFIX.error);
    if(exit) {
      process.exit(1);
    }
  }

  warning = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.warning, this.LOG_PREFIX.warning);
  }

  info = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.info, this.LOG_PREFIX.info);
  }

  access = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.access, this.LOG_PREFIX.access);
  }

  debug = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.debug, this.LOG_PREFIX.debug);
  }

  private static prefix_text = (text: string, prefix: string) => {
    if(prefix) {
      return text.split('\n').map(line => `[${prefix}] ${line}`).join('\n');
    }
    return text;
  }

  private log_to_stdout_and_file = async (message: string, log_level: LOG_LEVELS, line_prefix:string='', log_to_file:boolean=true) => {
    if(log_level <= this.LOG_LEVEL) {
      message = Log.prefix_text(message, line_prefix);
      console.log(message);
      if(log_to_file && this.LOG_FILE) {
        try {
          await append_file(this.LOG_FILE, message);
        } catch(e) {
          await this.log_to_stdout_and_file(`Failed to log to file (${String(e)}):\n${message}`, LOG_LEVELS.error, this.LOG_PREFIX.error, false);
        }
      }
    }
  }

}
