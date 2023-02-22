import express, { type Request, type Response } from 'express';

import { Logger } from './audit.logger.js';
import { type AuditTrail } from '../main.js';
import { type AuditTrailProps } from '../types/index.js';
import { type AuditRepository } from './audit.repository.js';

export class App {
  private readonly app: express.Application;
  private readonly auditTrail: AuditTrail;
  private readonly audtRepository: AuditRepository;

  constructor(auditTrail: AuditTrail, auditRepository: AuditRepository) {
    Logger.log('Initializing instance', App.name);

    this.app = express();
    this.auditTrail = auditTrail;
    this.audtRepository = auditRepository;

    this.mountMiddlewares()
      .then(() => {
        this.endpoints();
      })
      .catch((error: Error) => {
        Logger.error(error.message, App.name);
      });
  }

  public async mountMiddlewares(): Promise<void> {
    Logger.log('Mounting middlewares', App.name);

    this.app.use(express.json());
    this.app.use(this.auditTrail.capture());
  }

  private endpoints(): void {
    Logger.log('Mount endpoints', App.name);

    this.app.get('/audit-trails', (_: Request, res: Response) => {
      Logger.log('Get all audit trails', App.name);

      this.audtRepository
        .getAll()
        .then((auditTrails: AuditTrailProps[]) => {
          res.send({
            statusCode: 200,
            message: 'Successfully fetched audit trails',
            data: auditTrails
          });
        })
        .catch((error: Error) => {
          res.status(404)
            .send({
              statusCode: 404,
              message: error.message,
              data: {}
            });
        });
    });

    this.app.all('/test*', (req: Request, res: Response) => {
      Logger.log('Test route', App.name);

      const data = req.body;

      let statusCode: number;
      switch (req.method.toLowerCase()) {
        case 'post':
          statusCode = 201;
          break;
        case 'delete':
          statusCode = 204;
          break;
        default:
          statusCode = 200;
      }

      res.setHeader('audit', JSON.stringify({
        action: 'make a test request',
        resource: 'test',
        status: 'successful',
        resource_id: '32eebe9e-c1b4-4f65-9f95-4878b501a8a3',
        performed_for: '9c325c59-317b-43d8-b823-783c27bf49a0'
      }))
        .status(statusCode)
        .send({ data });
    });
  }

  public listen(port: number = 9089): void {
    if (process.env.NODE_ENV !== 'test') {
      this.app.listen(port, () => {
        Logger.log(`Server listening on port: ${port}`, App.name);
      });
    }
  }

  public getServer(): Express.Application {
    Logger.log('Get server instance', App.name);

    return this.app;
  }
}
