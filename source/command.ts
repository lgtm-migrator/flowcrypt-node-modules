
import {BaseConfig, CommandLineOptions} from './config';
import {Context} from './context';
import {Log} from './log';
import {Db} from './db';

export const new_command = (cmd: string, allow_options: string[], conf: {app_name: string, Constructor: typeof BaseConfig}, cb: (context: Context, local_opt: CommandLineOptions, ...args: string[]) => void) => {
  return (all_opt: CommandLineOptions, ...args: string[]) => {
    let local_opt: CommandLineOptions = {};
    let global_opt: CommandLineOptions = {};
    for(let opt_name of Object.keys(all_opt)) {
      if(BaseConfig.is_configurable(opt_name)) {
        global_opt[opt_name] = all_opt[opt_name];
      } else if(allow_options.indexOf(opt_name as never) !== -1) {
        local_opt[opt_name] = all_opt[opt_name];
      } else {
        Log._fatal(conf.app_name, `Unknown option for ${cmd}: ${opt_name}. Allowed options: ${allow_options}\nAllowed global options: ${BaseConfig.list_configurable(true)}`);
      }
    }
    let config = new conf.Constructor(conf.app_name, global_opt);
    let log = new Log(config);
    config.validate().then(() => {
      let db = new Db(config);
      cb(new Context(config, log, db), local_opt, ...args);
    }).catch(e => log.exception(e, undefined, true));
  };
};
