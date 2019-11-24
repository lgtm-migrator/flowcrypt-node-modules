import { RestfulRes, Dict } from '..';
import { HttpNotFoundErr, HttpClientErr } from '../api';
import { RestfulReq } from './restful-api';
import { IncomingMessage, ServerResponse } from 'http';
import { Context } from '../context';
const cookieModule = require('cookie');

console.log(cookieModule);

export class RestfulHandler {

  constructor(protected context: Context, protected devEnv = false) {
  }

  protected rootUrl = process.env.SERVER_URL!.replace(/\/$/, '');

  async get(restfulReq: RestfulReq, req: IncomingMessage, res: ServerResponse): Promise<RestfulRes> {
    throw new HttpNotFoundErr();
  }

  async post(restfulReq: RestfulReq, req: IncomingMessage, res: ServerResponse): Promise<RestfulRes> {
    throw new HttpNotFoundErr();
  }

  async put(restfulReq: RestfulReq, req: IncomingMessage, res: ServerResponse): Promise<RestfulRes> {
    throw new HttpNotFoundErr();
  }

  async delete(restfulReq: RestfulReq, req: IncomingMessage, res: ServerResponse): Promise<RestfulRes> {
    throw new HttpNotFoundErr();
  }

  // ---


  protected throwIfNoBody(body: Buffer) {
    if (!body.length) {
      throw new HttpClientErr('Body should not be empty');
    }
  }

  protected throwIfHasBody(body: Buffer) {
    if (body.length) {
      throw new HttpClientErr('Body should be empty');
    }
  }

  protected throwIfHasQueryParams(query: Dict<string>) {
    if (Object.keys(query).length) {
      throw new HttpClientErr('This resource is not accepting query parameters');
    }
  }

  protected escape(str: string) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;');
  }

  protected setCookie(res: ServerResponse, key: string, value: string) {
    const serialized = cookieModule.serialize(key, value)
    console.log('serialized', serialized);
    res.setHeader('Set-Cookie', serialized);
  }

  protected getCookie(rawReq: IncomingMessage, key: string) {
    const parsed = cookieModule.parse(rawReq.headers.cookie);
    console.log('parsed', parsed);
    return undefined;
  }


}