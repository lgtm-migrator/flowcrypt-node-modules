
import { Config, CmdLineOpts } from './config';
import { Context } from './context';
import { Log } from './log';
import { Db } from './db';

export const newCmd = (cmd: string, allowOpts: string[], config: Config, cb: (context: Context, localOpts: CmdLineOpts, ...args: string[]) => void, cmdNeedsDb = true) => {
  return (allOpts: CmdLineOpts, ...args: string[]) => {
    let localOpts: CmdLineOpts = {};
    let globalOpts: CmdLineOpts = {};
    for (let optName of Object.keys(allOpts)) {
      if (config.isConfigurable(optName)) {
        globalOpts[optName] = allOpts[optName];
      } else if (allowOpts.indexOf(optName as never) !== -1) {
        localOpts[optName] = allOpts[optName];
      } else {
        new Log(config).fatal(`Unknown option for ${cmd}: ${optName}. Allowed options: ${allowOpts}\nAllowed global options: ${config.listConfigurable(true)}`);
      }
    }
    config.setCmdLineOpts(globalOpts);
    let log = new Log(config);
    config.validate(cmdNeedsDb).then(() => {
      let db: Db | undefined;
      if (cmdNeedsDb) {
        db = new Db(config);
      }
      cb(new Context(config, log, db), localOpts, ...args);
    }).catch(e => log.exception(e, undefined, true));
  };
};
