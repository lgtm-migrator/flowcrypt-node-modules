import { HttpNotFoundErr, Status } from './../api';
import { RestfulReq, RestfulRes, ContentType } from './restful-api';
import { Dict } from './../index';
import { RestfulHandler } from './restful-handler';
import { readFile } from '../util';

export class AssetsHandler extends RestfulHandler {

  private cache: Dict<Buffer | null> = {}
  private types: Dict<ContentType> = {
    'js': 'text/javascript',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'html': 'text/html',
    'css': 'text/css',
    'txt': 'text/plain',
  }

  async get({ url }: RestfulReq): Promise<RestfulRes> {
    if (url.includes('..')) {
      throw new HttpNotFoundErr('.. not allowed in url');
    }
    const extension = url.split('.').pop();
    if (!extension) {
      throw new HttpNotFoundErr('Missing asset extension');
    }
    const contentType = this.types[extension];
    if (!contentType) {
      throw new HttpNotFoundErr(`Unknown asset contentType for ${contentType}`);
    }
    const cached = this.cache[url];
    if (cached) {
      return { status: Status.OK, contentType, body: cached }
    }
    if (cached === null) { // already known to be 404, don't check the disk
      throw new HttpNotFoundErr();
    }
    try {
      const content = await readFile(`.${url}`);
      this.cache[url] = content;
      return { status: Status.OK, contentType, body: content }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('ENOENT')) {
        this.cache[url] = null;
        throw new HttpNotFoundErr();
      }
      throw e;
    }
  }

}