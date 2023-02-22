import type { Response, Send } from 'express';

import { Logger } from './audit.logger';

export class RequestInterceptor {
  constructor() {
    Logger.log('Initializing instance', RequestInterceptor.name);
  }

  public intercept(res: Response, send: any): Send {
    Logger.log('Intercepts response data object', RequestInterceptor.name);
    // @ts-expect-error
    return (content: any): Send<any, Response<any, Record<string, any>>> => {
      content = typeof content === 'string' ? JSON.parse(content) : content;

      content.intercepted = true;
      res.locals.interceptedData = content;
      res.send = send;
      res.send(content);
    };
  }
}
