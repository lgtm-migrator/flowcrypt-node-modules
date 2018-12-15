
import { Config, CommandLineOptions } from './config';
import { Context } from './context';
import { Log } from './log';
import { Db } from './db';

export const new_command = (cmd: string, allow_options: string[], config: Config, cb: (context: Context, local_opt: CommandLineOptions, ...args: string[]) => void, cmdNeedsDb = true) => {
  return (all_opt: CommandLineOptions, ...args: string[]) => {
    let local_opt: CommandLineOptions = {};
    let global_opt: CommandLineOptions = {};
    for (let opt_name of Object.keys(all_opt)) {
      if (config.is_configurable(opt_name)) {
        global_opt[opt_name] = all_opt[opt_name];
      } else if (allow_options.indexOf(opt_name as never) !== -1) {
        local_opt[opt_name] = all_opt[opt_name];
      } else {
        new Log(config).fatal(`Unknown option for ${cmd}: ${opt_name}. Allowed options: ${allow_options}\nAllowed global options: ${config.list_configurable(true)}`);
      }
    }
    config.set_cmd_line_options(global_opt);
    let log = new Log(config);
    config.validate(cmdNeedsDb).then(() => {
      let db: Db | undefined;
      if (cmdNeedsDb) {
        db = new Db(config);
      }
      cb(new Context(config, log, db), local_opt, ...args);
    }).catch(e => log.exception(e, undefined, true));
  };
};
