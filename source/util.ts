
import * as fs from 'fs';

export let read_file = (path: string): Promise<Buffer> => new Promise((resolve, reject) => fs.readFile(path, (e, data) => e ? reject(e) : resolve(data)));

export let move_file = (from: string, to: string): Promise<Buffer> => new Promise((resolve, reject) => fs.rename(from, to, (e) => e ? reject(e) : resolve()));

export let write_file = (path: string): Promise<Buffer> => new Promise((resolve, reject) => fs.readFile(path, (e, data) => e ? reject(e) : resolve(data)));

export let append_file = (path: string, text: string): Promise<void> => new Promise((resolve, reject) => fs.appendFile(path, text, (e) => e ? reject(e) : resolve()));

export let delete_file = (path: string): Promise<Buffer> => new Promise((resolve, reject) => fs.unlink(path, (e) => e ? reject(e) : resolve()));

export let read_dir = (path: string): Promise<string[]> => new Promise((resolve, reject) => fs.readdir(path, (e, files) => e ? reject(e) : resolve(files)));

export let mk_dir = (path: string): Promise<void> => new Promise((resolve, reject) => fs.mkdir(path, (e) => e ? reject(e) : resolve()));

export let str_to_hex = (s: string): string => { // http://phpjs.org/functions/bin2hex/, Kevin van Zonneveld (http://kevin.vanzonneveld.net), Onno Marsman, Linuxworld, ntoniazzi
  let i, l, o = '', n;
  s += '';
  for(i = 0, l = s.length; i < l; i++) {
    n = s.charCodeAt(i).toString(16);
    o += n.length < 2 ? '0' + n : n;
  }
  return o;
};

export let uint8_to_str = (u8a: Uint8Array): string => {
  let CHUNK_SZ = 0x8000;
  let c = [];
  for(let i = 0; i < u8a.length; i += CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
  }
  return c.join('');
};

export let keyid_bytes_to_hex = (bytes: string): string => str_to_hex(bytes).toUpperCase();

export let wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export let chunks = <T> (array: T[], size: number): T[][] => {
  let results = [];
  while (array.length) {
    results.push(array.splice(0, size));
  }
  return results;
};

export let lousy_random = (length:number=5) => {
  let id = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < length; i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return id;
};
