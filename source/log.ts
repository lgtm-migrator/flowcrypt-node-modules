
import { Config, LOG_LEVELS } from './config';
import { appendFile } from './util';

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
    message = Log.prefixText(message, this.build_prefix(this.config.APP_NAME, 'ERROR'));
    console.log(message);
    process.exit(1);
  }

  public exception = async (e: Error, details?: string, exit = false) => {
    let asStr = String(e);
    if (e instanceof Error && e.stack) {
      asStr += `\n${Log.prefixText(e.stack, 'stack')}`;
    }
    if (details) {
      asStr += `\n${Log.prefixText(details, 'details')}`;
    }
    await this.error(asStr, exit);
  }

  public error = async (message: string, exit = false) => {
    await this.logToStdoutAndFile(message, LOG_LEVELS.error, this.LOG_PREFIX.error);
    if (exit) {
      process.exit(1);
    }
  }

  public warning = async (message: string) => {
    await this.logToStdoutAndFile(message, LOG_LEVELS.warning, this.LOG_PREFIX.warning);
  }

  public info = async (message: string) => {
    await this.logToStdoutAndFile(message, LOG_LEVELS.info, this.LOG_PREFIX.info);
  }

  public access = async (message: string) => {
    await this.logToStdoutAndFile(message, LOG_LEVELS.access, this.LOG_PREFIX.access);
  }

  public debug = async (message: string) => {
    await this.logToStdoutAndFile(message, LOG_LEVELS.debug, this.LOG_PREFIX.debug);
  }

  public static prefixText = (text: string, prefix: string) => {
    if (prefix) {
      return text.split('\n').map(line => `[${prefix}] ${line}`).join('\n');
    }
    return text;
  }

  private logToStdoutAndFile = async (message: string, logLevel: LOG_LEVELS, linePrefix: string = '', logToFile: boolean = true) => {
    if (logLevel <= this.LOG_LEVEL) {
      message = Log.prefixText(message, linePrefix);
      console.log(message);
      if (logToFile && this.LOG_FILE) {
        try {
          await appendFile(this.LOG_FILE, message);
        } catch (e) {
          await this.logToStdoutAndFile(`Failed to log to file (${String(e)}):\n${message}`, LOG_LEVELS.error, this.LOG_PREFIX.error, false);
        }
      }
    }
  }

  private build_prefix = (app_name: string, prefix: string) => {
    return `${app_name.toUpperCase()}_${prefix}`;
  }

}
