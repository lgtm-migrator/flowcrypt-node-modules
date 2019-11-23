import { RestfulRes, Dict } from '..';
import { HttpNotFoundErr, HttpClientErr } from '../api';
import { RestfulReq } from './restful-api';
import { IncomingMessage } from 'http';
import { Context } from '../context';

export class RestfulHandler {

  constructor(protected context: Context) {
  }

  protected rootUrl = process.env.SERVER_URL!.replace(/\/$/, '');

  async get(restfulReq: RestfulReq, req: IncomingMessage): Promise<RestfulRes> {
    throw new HttpNotFoundErr();
  }

  async post(restfulReq: RestfulReq, req: IncomingMessage): Promise<RestfulRes> {
    throw new HttpNotFoundErr();
  }

  async put(restfulReq: RestfulReq, req: IncomingMessage): Promise<RestfulRes> {
    throw new HttpNotFoundErr();
  }

  async delete(restfulReq: RestfulReq, req: IncomingMessage): Promise<RestfulRes> {
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

}