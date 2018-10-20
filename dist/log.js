"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const util_1 = require("./util");
var LOG_PREFIX;
(function (LOG_PREFIX) {
    LOG_PREFIX["error"] = "SKS_SPONGE_ERROR";
    LOG_PREFIX["warning"] = "SKS_SPONGE_WARNING";
    LOG_PREFIX["info"] = "SKS_SPONGE_INFO";
    LOG_PREFIX["access"] = "";
    LOG_PREFIX["debug"] = "";
})(LOG_PREFIX || (LOG_PREFIX = {}));
class Log {
    constructor(config) {
        this.fatal = Log._fatal;
        this.exception = async (e, details, exit = false) => {
            let as_string = String(e);
            if (e instanceof Error && e.stack) {
                as_string += `\n${Log.prefix_text(e.stack, 'stack')}`;
            }
            if (details) {
                as_string += Log.prefix_text(details, 'details');
            }
            await this.error(as_string, exit);
        };
        this.error = async (message, exit = false) => {
            await this.log_to_stdout_and_file(message, config_1.LOG_LEVELS.error, LOG_PREFIX.error);
            if (exit) {
                process.exit(1);
            }
        };
        this.warning = async (message) => {
            await this.log_to_stdout_and_file(message, config_1.LOG_LEVELS.warning, LOG_PREFIX.warning);
        };
        this.info = async (message) => {
            await this.log_to_stdout_and_file(message, config_1.LOG_LEVELS.info, LOG_PREFIX.info);
        };
        this.access = async (message) => {
            await this.log_to_stdout_and_file(message, config_1.LOG_LEVELS.access, LOG_PREFIX.access);
        };
        this.debug = async (message) => {
            await this.log_to_stdout_and_file(message, config_1.LOG_LEVELS.debug, LOG_PREFIX.debug);
        };
        this.log_to_stdout_and_file = async (message, log_level, line_prefix = '', log_to_file = true) => {
            if (log_level <= this.LOG_LEVEL) {
                message = Log.prefix_text(message, line_prefix);
                console.log(message);
                if (log_to_file && this.LOG_FILE) {
                    try {
                        await util_1.append_file(this.LOG_FILE, message);
                    }
                    catch (e) {
                        await this.log_to_stdout_and_file(`Failed to log to file (${String(e)}):\n${message}`, config_1.LOG_LEVELS.error, LOG_PREFIX.error, false);
                    }
                }
            }
        };
        this.LOG_FILE = config.LOG_DIRECTORY ? `${config.LOG_DIRECTORY}/sks_sponge` : null;
        this.LOG_LEVEL = config.LOG_LEVEL;
    }
}
Log._fatal = (message) => {
    message = Log.prefix_text(message, LOG_PREFIX.error);
    console.log(message);
    process.exit(1);
};
Log.prefix_text = (text, prefix) => {
    if (prefix) {
        return text.split('\n').map(line => `[${prefix}] ${line}`).join('\n');
    }
    return text;
};
exports.Log = Log;
//# sourceMappingURL=log.js.map