import knex, { type Knex } from 'knex';

import { Env } from '../utils/env';
import { Logger } from '../audits/audit.logger';
import { type MigrationSource } from './migration.source';
import type { DbConnection, ConfigObject } from '../types/index';

export class KnexFile {
  private readonly db: Knex;
  private readonly env: DbConnection;
  private readonly migrationSource: MigrationSource;

  constructor(options: DbConnection, migrationSource: MigrationSource) {
    Logger.log('Initializing instance', KnexFile.name);

    if (!Env.getAll()) {
      Env.save(options);
    }

    this.env = Env.getAll();
    this.db = this.initDB();
    this.migrationSource = migrationSource;
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
      },
      migrations: {
        directory: './migrations',
        tableName: `${this.env.table_name as string}_migrations`,
        extension: 'ts'
      }
    };
  }

  private initDB(): Knex {
    return knex(this.getConfig());
  }

  public getDBInstance(): Knex {
    return this.initDB();
  }

  public async runMigrations(): Promise<void> {
    Logger.log('Running database migrations', KnexFile.name);

    const migrationConfig = {
      migrationSource: this.migrationSource
    };

    const [batchNo, log] = await this.db.migrate.latest(migrationConfig);

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
