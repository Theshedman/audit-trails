import { type NextFunction, type Request, type Response } from 'express';

import { Logger } from './audit.logger.js';
import { AuditEvent } from './audit.event.js';
import { type AuditRepository } from './audit.repository.js';
import { type RequestInterceptor } from './audit.interceptor.js';
import type { AuditHeader, AuditTrailProps, MiddlewarePathParams } from '../types/index.js';

export class Middleware extends AuditEvent {
  private readonly requestInterceptor: RequestInterceptor;

  constructor(auditRepository: AuditRepository, requestInterceptor: RequestInterceptor) {
    Logger.log('Initializing instance', Middleware.name);

    super();

    this.requestInterceptor = requestInterceptor;
    this.on(this.getEvent().SAVE, (data: AuditTrailProps) => {
      Logger.log('Listens for audit trails \'save\' event', Middleware.name);

      auditRepository
        .save(data)
        .then(() => { })
        .catch((e: Error) => { });
    });
  }

  public mount(): MiddlewarePathParams {
    Logger.log('Capturing and Processing audit trail request', Middleware.name);

    return (req: Request, res: Response, next: NextFunction): void => {
      const url = new URL(req?.url, `https://${req.headers.host as string}`);
      const pathRegex = new RegExp(url.pathname);

      if (pathRegex.test('/audit-trails')) {
        next();
        return;
      }

      res.send = this.requestInterceptor.intercept(res, res.send);
      res.on('finish', () => {
        const auditHeaderString = res.getHeader('audit') as string;
        const auditHeader: AuditHeader = JSON.parse(auditHeaderString);
        let { resource, resource_id: resourceId, action, performed_for: performedFor, status } = auditHeader;

        const statusCode = res.statusCode;
        status = status || (statusCode >= 200 && statusCode < 300 ? 'successful' : 'failed');

        const auditTrail: AuditTrailProps = {
          status,
          action,
          resource,
          endpoint: url.href,
          request_data: req.body,
          action_type: req.method,
          resource_id: resourceId,
          performed_for: performedFor,
          status_code: `${res.statusCode}`,
          role: req.headers.role as string,
          performed_by: req.headers.aud as string,
          response_msg: res.locals.interceptedData.message
        };

        delete req.headers.aud;
        delete req.headers.role;

        Logger.log('Emit audit trail \'save\' event', Middleware.name);
        this.emit(this.getEvent().SAVE, auditTrail);
      });

      next();
    };
  }
}
