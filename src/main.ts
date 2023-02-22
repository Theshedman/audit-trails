import { Env } from './utils/env.js';
import { KnexFile } from './database/knexfile.js';
import { Logger } from './audits/audit.logger.js';
import { App } from './audits/audit.controller.js';
import { Middleware } from './audits/audit.middleware.js';
import { AuditRepository } from './audits/audit.repository.js';
import type { PathParams, DbConnection } from './types/index.js';
import { RequestInterceptor } from './audits/audit.interceptor.js';

export class AuditTrail {
  private readonly app: App;
  private readonly knexFile: KnexFile;
  private readonly middleware: Middleware;
  private readonly auditRepository: AuditRepository;
  private readonly requestInterceptor: RequestInterceptor;

  constructor(options: DbConnection) {
    Logger.log('Initializing instance', AuditTrail.name);

    // KnexFile and AuditRepository depend on the Env variables.
    // Ensure that the Environment variables are saved
    // before initializing KnexFile and AuditRepository
    Env.save(options);

    this.knexFile = new KnexFile();
    this.auditRepository = new AuditRepository(this.knexFile);
    this.requestInterceptor = new RequestInterceptor();
    this.middleware = new Middleware(this.auditRepository, this.requestInterceptor);

    if (Env.nodeEnv() !== 'test') {
      this.knexFile
        .runMigrations()
        .then(() => {
          Logger.log('Migrations completed', KnexFile.name);
        })
        .catch(() => {
          Logger.error('Migrations failed', KnexFile.name);
        });
    }

    this.app = new App(this, this.auditRepository);
    this.startServer();
  }

  public getDefaultOptions(): Partial<DbConnection> {
    return Env.getDefaults();
  }

  public capture(): PathParams {
    Logger.log('Capture and Intercept HTTP Requests', AuditTrail.name);

    return this.middleware.mount() as unknown as PathParams;
  }

  private startServer(): void {
    this.app.listen();
  }

  public getServer(): Express.Application {
    return this.app.getServer();
  }
}
