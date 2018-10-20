"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
exports.read_file = (path) => new Promise((resolve, reject) => fs.readFile(path, (e, data) => e ? reject(e) : resolve(data)));
exports.move_file = (from, to) => new Promise((resolve, reject) => fs.rename(from, to, (e) => e ? reject(e) : resolve()));
exports.write_file = (path) => new Promise((resolve, reject) => fs.readFile(path, (e, data) => e ? reject(e) : resolve(data)));
exports.append_file = (path, text) => new Promise((resolve, reject) => fs.appendFile(path, text, (e) => e ? reject(e) : resolve()));
exports.delete_file = (path) => new Promise((resolve, reject) => fs.unlink(path, (e) => e ? reject(e) : resolve()));
exports.read_dir = (path) => new Promise((resolve, reject) => fs.readdir(path, (e, files) => e ? reject(e) : resolve(files)));
exports.mk_dir = (path) => new Promise((resolve, reject) => fs.mkdir(path, (e) => e ? reject(e) : resolve()));
exports.str_to_hex = (s) => {
    let i, l, o = '', n;
    s += '';
    for (i = 0, l = s.length; i < l; i++) {
        n = s.charCodeAt(i).toString(16);
        o += n.length < 2 ? '0' + n : n;
    }
    return o;
};
exports.uint8_to_str = (u8a) => {
    let CHUNK_SZ = 0x8000;
    let c = [];
    for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    }
    return c.join('');
};
exports.keyid_bytes_to_hex = (bytes) => exports.str_to_hex(bytes).toUpperCase();
exports.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.chunks = (array, size) => {
    let results = [];
    while (array.length) {
        results.push(array.splice(0, size));
    }
    return results;
};
exports.lousy_random = (length = 5) => {
    let id = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < length; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
};
//# sourceMappingURL=util.js.map