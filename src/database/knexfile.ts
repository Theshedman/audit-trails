import knex, { type Knex } from 'knex';
import { type DbConnection, type ConfigObject } from '../types/index.js';
import { Env } from '../utils/env.js';
import { Logger } from '../audits/audit.logger.js';

export class KnexFile {
  private readonly env: DbConnection;
  private readonly db: Knex;

  constructor() {
    Logger.log('Initializing instance', KnexFile.name);

    this.env = Env.getAll();
    this.db = this.initDB();
  }

  private getConnection(): DbConnection {
    let { host, password, user, database, port, ssl } = this.env;

    if (ssl === true) {
      ssl = {
        rejectUnauthorized: true
      };
    } else if (ssl === false) {
      ssl = {
        rejectUnauthorized: false
      };
    }

    const dbConnection: DbConnection = {
      host,
      user,
      password,
      database,
      port,
      ssl
    };

    return dbConnection;
  }

  public getConfig(): ConfigObject {
    return {
      client: 'pg',
      searchPath: 'public',
      connection: this.getConnection(),
      pool: {
        min: 0,
        max: 10
      }
    };
  }

  private initDB(): Knex {
    // @ts-expect-error
    return knex(this.getConfig());
  }

  public getDBInstance(): Knex {
    return this.initDB();
  }

  public async runMigrations(): Promise<void> {
    Logger.log('Running database migrations', KnexFile.name);

    const migrationConfig = {
      database: this.env.database,
      directory: 'dist/src/database/migrations',
      extension: 'ts',
      tableName: 'audit-trail-migrations',
      disableTransactions: false,
      loadExtensions: ['.js']
    };

    const [batchNo, log] = await this.db.migrate.latest(migrationConfig);

    // .then(([batchNo, log]: any) => {
    if (!log.length) {
      Logger.log('Database is already up to date', KnexFile.name);
    } else {
      Logger.log(`Ran batch: ${batchNo as number}`, KnexFile.name);
      Logger.log(`Ran migrations: ${log as string}`, KnexFile.name);
    }

    // Important to destroy the database, otherwise Node script won't exit
    // because Knex keeps open handles.
    await this.db.destroy();
  }
}
