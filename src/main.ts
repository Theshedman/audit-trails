import { Env } from './utils/env';
import { KnexFile } from './database/knexfile';
import { Logger } from './audits/audit.logger';
import { App } from './audits/audit.controller';
import { Middleware } from './audits/audit.middleware';
import { AuditRepository } from './audits/audit.repository';
import type { PathParams, DbConnection } from './types/index';
import { MigrationSource } from './database/migration.source';
import { RequestInterceptor } from './audits/audit.interceptor';

export class AuditTrail {
  private readonly app: App;
  private readonly knexFile: KnexFile;
  private readonly middleware: Middleware;
  private readonly auditRepository: AuditRepository;
  private readonly migrationSource: MigrationSource;
  private readonly requestInterceptor: RequestInterceptor;

  constructor(options: DbConnection) {
    Logger.log('Initializing instance', AuditTrail.name);

    Env.save(options);

    this.migrationSource = new MigrationSource();
    this.knexFile = new KnexFile(options, this.migrationSource);
    this.auditRepository = new AuditRepository(this.knexFile);
    this.requestInterceptor = new RequestInterceptor();
    this.middleware = new Middleware(this.auditRepository, this.requestInterceptor);

    if (Env.nodeEnv() !== 'test') {
      this.knexFile
        .runMigrations()
        .then(() => {
          Logger.log('Migrations completed', KnexFile.name);
        })
        .catch((e: Error) => {
          Logger.error(`Migrations failed: ${e.message}`, KnexFile.name);
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
    this.app.listen(9009);
  }

  public getServer(): Express.Application {
    return this.app.getServer();
  }
}

const options = {
  host: 'localhost',
  schema_name: 'audit',
  password: 'ashedrack',
  database: 'dvdrental',
  user: 'postgres'
};

const auditTrail = new AuditTrail(options);
auditTrail.getServer();
