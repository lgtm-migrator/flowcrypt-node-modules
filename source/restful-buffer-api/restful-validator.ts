import { HttpClientErr } from '../api';
import { Dict } from '..';

export class RestfulValidator {

  public static throwIfNoBody(body: Buffer) {
    if (!body.length) {
      throw new HttpClientErr('Body should not be empty');
    }
  }

  public static throwIfHasBody(body: Buffer) {
    if (body.length) {
      throw new HttpClientErr('Body should be empty');
    }
  }

  public static throwIfHasQueryParams(query: Dict<string>) {
    if (Object.keys(query).length) {
      throw new HttpClientErr('This resource is not accepting query parameters');
    }
  }

}