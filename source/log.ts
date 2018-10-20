
import {Config, LOG_LEVELS} from './config';
import {append_file} from './util';

enum LOG_PREFIX {
  error = 'SKS_SPONGE_ERROR',
  warning = 'SKS_SPONGE_WARNING',
  info = 'SKS_SPONGE_INFO',
  access = '',
  debug = '',
}

export class Log {

  LOG_FILE: string|null;
  LOG_LEVEL: LOG_LEVELS;

  constructor(config: Config) {
    this.LOG_FILE = config.LOG_DIRECTORY ? `${config.LOG_DIRECTORY}/sks_sponge` : null;
    this.LOG_LEVEL = config.LOG_LEVEL;
  }

  static _fatal = (message: string) => {
    message = Log.prefix_text(message, LOG_PREFIX.error);
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
    await this.log_to_stdout_and_file(message, LOG_LEVELS.error, LOG_PREFIX.error);
    if(exit) {
      process.exit(1);
    }
  }

  warning = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.warning, LOG_PREFIX.warning);
  }

  info = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.info, LOG_PREFIX.info);
  }

  access = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.access, LOG_PREFIX.access);
  }

  debug = async (message: string) => {
    await this.log_to_stdout_and_file(message, LOG_LEVELS.debug, LOG_PREFIX.debug);
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
          await this.log_to_stdout_and_file(`Failed to log to file (${String(e)}):\n${message}`, LOG_LEVELS.error, LOG_PREFIX.error, false);
        }
      }
    }
  }

}
