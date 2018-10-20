"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("./context");
const log_1 = require("./log");
const db_1 = require("./db");
exports.new_command = (cmd, allow_options, env_config, cb) => {
    return (all_opt, ...args) => {
        let local_opt = {};
        let global_opt = {};
        for (let opt_name of Object.keys(all_opt)) {
            if (env_config.is_configurable(opt_name)) {
                global_opt[opt_name] = all_opt[opt_name];
            }
            else if (allow_options.indexOf(opt_name) !== -1) {
                local_opt[opt_name] = all_opt[opt_name];
            }
            else {
                new log_1.Log(env_config).fatal(`Unknown option for ${cmd}: ${opt_name}. Allowed options: ${allow_options}\nAllowed global options: ${env_config.list_configurable(true)}`);
            }
        }
        let config = new env_config.constructor(global_opt);
        let log = new log_1.Log(config);
        config.validate().then(() => {
            let db = new db_1.Db(config);
            cb(new context_1.Context(config, log, db), local_opt, ...args);
        }).catch(e => log.exception(e, undefined, true));
    };
};
//# sourceMappingURL=command.js.map