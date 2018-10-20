"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("./util");
const log_1 = require("./log");
var LOG_LEVELS;
(function (LOG_LEVELS) {
    LOG_LEVELS[LOG_LEVELS["error"] = 0] = "error";
    LOG_LEVELS[LOG_LEVELS["warning"] = 1] = "warning";
    LOG_LEVELS[LOG_LEVELS["info"] = 2] = "info";
    LOG_LEVELS[LOG_LEVELS["access"] = 3] = "access";
    LOG_LEVELS[LOG_LEVELS["debug"] = 4] = "debug";
})(LOG_LEVELS = exports.LOG_LEVELS || (exports.LOG_LEVELS = {}));
class BaseConfig {
    constructor(app_name, cmd_line_options) {
        this.LOG_LEVEL = LOG_LEVELS.info;
        this.LOG_DIRECTORY = '';
        this.DB_HOST = '127.0.0.1';
        this.DB_PORT = 26257;
        this.DB_NAME = 'db_test';
        this.DB_USER = 'user_test';
        this.DB_CERTS_PATH = 'certs';
        this.DB_INSECURE = false;
        this.validate = async () => {
            if (!this.DB_INSECURE && !this.DB_CERTS_PATH) {
                await this.log.error('Certs path is required when running in secure db mode\neither run with --db-insecure or --db-certs-path=folder', true);
            }
            if (!this.DB_INSECURE) {
                try {
                    let files = await util.read_dir(this.DB_CERTS_PATH);
                    for (let file of files) {
                        await this.log.error(`Missing a cert needed for secure db mode: ${this.DB_CERTS_PATH}/${file}\nadjust path with --db-certs-path=folder, run with --db-insecure or make sure the file is present`, true);
                    }
                }
                catch (e) {
                    await this.log.error(`cannot access certs directory: ${e.message}\nadjust path with --db-certs-path=folder or run with --db-insecure`, true);
                }
            }
        };
        this.set_option = (name, value) => {
            name = name.toUpperCase().replace(/-/g, '_');
            if (name === 'DB_HOST') {
                this.DB_HOST = value;
            }
            else if (name === 'DB_PORT') {
                let n = Number(value);
                if (isNaN(n)) {
                    throw new Error(`DB_PORT: not a number (${value})`);
                }
                this.DB_PORT = Number(value);
            }
            else if (name === 'DB_NAME') {
                this.DB_NAME = value;
            }
            else if (name === 'DB_USER') {
                this.DB_USER = value;
            }
            else if (name === 'DB_CERTS_PATH') {
                this.DB_CERTS_PATH = value;
            }
            else if (name === 'DB_INSECURE') {
                this.DB_INSECURE = Boolean(value);
            }
            else if (name === 'LOG_DIRECTORY') {
                this.LOG_DIRECTORY = value;
            }
            else if (name === 'LOG_LEVEL') {
                let n = Number(value);
                if (isNaN(n) && n >= 0 && n <= 4) {
                    throw new Error(`LOG_LEVEL: should be a number 0-4, got (${value})`);
                }
                this.LOG_LEVEL = n;
            }
            else {
                throw new Error(`Unknown config variable: ${name}`);
            }
        };
        this.APP_NAME = app_name;
        for (let name of Object.keys(process.env)) {
            if (BaseConfig.KEYS_CONFIGURABLE.indexOf(name) !== -1) {
                this.set_option(name, process.env[name]);
            }
        }
        for (let name of Object.keys(cmd_line_options)) {
            this.set_option(name, cmd_line_options[name]);
        }
        // @ts-ignore
        let format_config_line = (k) => `Config ${k}=${this[k]}`;
        this.log = new log_1.Log(this);
        this.log.debug(BaseConfig.KEYS_CONFIGURABLE.map(format_config_line).join('\n'));
    }
}
BaseConfig.KEYS_CONFIGURABLE = [
    'LOG_LEVEL', 'LOG_DIRECTORY',
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_CERTS_PATH', 'DB_INSECURE',
];
BaseConfig.is_configurable = (option_name) => {
    return BaseConfig.KEYS_CONFIGURABLE.indexOf(BaseConfig.env_var_format(option_name)) !== -1;
};
BaseConfig.list_configurable = (cmd_line = false) => {
    if (cmd_line) {
        return BaseConfig.KEYS_CONFIGURABLE.map(BaseConfig.cmd_line_format);
    }
    return BaseConfig.KEYS_CONFIGURABLE;
};
BaseConfig.get_api_port = (cmd_line_port) => {
    if (cmd_line_port) {
        if (isNaN(Number(cmd_line_port))) {
            throw new Error(`Specified port is not a number: ${cmd_line_port}`);
        }
        return Number(cmd_line_port);
    }
    else if (process.env.PORT) {
        if (isNaN(Number(process.env.PORT))) {
            throw new Error(`Specified env PORT is not a number: ${process.env.PORT}`);
        }
        return Number(process.env.PORT);
    }
    else {
        return 5006;
    }
};
BaseConfig.cmd_line_format = (option_name) => {
    return option_name.toLowerCase().replace(/_/g, '-');
};
BaseConfig.env_var_format = (option_name) => {
    return option_name.toUpperCase().replace(/-/g, '_');
};
exports.BaseConfig = BaseConfig;
//# sourceMappingURL=config.js.map