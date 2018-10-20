"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const context_1 = require("./context");
const log_1 = require("./log");
const db_1 = require("./db");
exports.new_command = (cmd, allow_options, conf, cb) => {
    return (all_opt, ...args) => {
        let local_opt = {};
        let global_opt = {};
        for (let opt_name of Object.keys(all_opt)) {
            if (config_1.BaseConfig.is_configurable(opt_name)) {
                global_opt[opt_name] = all_opt[opt_name];
            }
            else if (allow_options.indexOf(opt_name) !== -1) {
                local_opt[opt_name] = all_opt[opt_name];
            }
            else {
                log_1.Log._fatal(conf.app_name, `Unknown option for ${cmd}: ${opt_name}. Allowed options: ${allow_options}\nAllowed global options: ${config_1.BaseConfig.list_configurable(true)}`);
            }
        }
        let config = new conf.Constructor(conf.app_name, global_opt);
        let log = new log_1.Log(config);
        config.validate().then(() => {
            let db = new db_1.Db(config);
            cb(new context_1.Context(config, log, db), local_opt, ...args);
        }).catch(e => log.exception(e, undefined, true));
    };
};
//# sourceMappingURL=command.js.map