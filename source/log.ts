
import { Config, LOG_LEVELS } from './config';
import { append_file } from './util';

export class Log {

  private config: Config;
  private LOG_FILE: string | null;
  private LOG_LEVEL: LOG_LEVELS;
  private LOG_PREFIX: { error: string, warning: string, info: string, access: string, debug: string };

  constructor(config: Config) {
    this.LOG_FILE = config.LOG_DIRECTORY ? `${config.LOG_DIRECTORY}/${config.APP_NAME}` : null;
    this.LOG_LEVEL = config.LOG_LEVEL;
    this.LOG_PREFIX = {
      error: this.build_prefix(config.APP_NAME, 'ERROR'),
      warning: this.build_prefix(config.APP_NAME, 'WARNING'),
      info: this.build_prefix(config.APP_NAME, 'INFO'),
      access: '',
      debug: '',
    };
    this.config = config;
  }

  public fatal = (message: string) => {
    message = Log.prefix_text(message, this.build_prefix(this.config.APP_NAME, 'ERROR'));
    console.log(message);
    process.exit(1);
  }

  public exception = async (e: Error, details?: string, exit = false) => {
    let as_string = String(e);
    if (e instanceof Error && e.stack) {
      as_string += `\n${Log.prefix_text(e.stack, 'stack')}`;
    }
    if (details) {
      as_string += `\n${Log.prefix_text(details, 'details')}`;
    }
    await this.error(as_string, exit);
  }

  public error = async (message: string, exit = false) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.error, this.LOG_PREFIX.error);
    if (exit) {
      process.exit(1);
    }
  }

  public warning = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.warning, this.LOG_PREFIX.warning);
  }

  public info = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.info, this.LOG_PREFIX.info);
  }

  public access = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.access, this.LOG_PREFIX.access);
  }

  public debug = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.debug, this.LOG_PREFIX.debug);
  }

  private static prefix_text = (text: string, prefix: string) => {
    if (prefix) {
      return text.split('\n').map(line => `[${prefix}] ${line}`).join('\n');
    }
    return text;
  }

  private log_to_stdout_and_file = async (message: string, log_level: LOG_LEVELS, line_prefix: string = '', log_to_file: boolean = true) => {
    if (log_level <= this.LOG_LEVEL) {
      message = Log.prefix_text(message, line_prefix);
      console.log(message);
      if (log_to_file && this.LOG_FILE) {
        try {
          await append_file(this.LOG_FILE, message);
        } catch (e) {
          await this.log_to_stdout_and_file(`Failed to log to file (${String(e)}):\n${message}`, LOG_LEVELS.error, this.LOG_PREFIX.error, false);
        }
      }
    }
  }

  private build_prefix = (app_name: string, prefix: string) => {
    return `${app_name.toUpperCase()}_${prefix}`;
  }

}
