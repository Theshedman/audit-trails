import { Logger } from '../audits/audit.logger.js';
import { type DbConnection } from '../types/index.js';

export class Env {
  private static envs: DbConnection;
  private static readonly defaults = {
    port: 5432,
    table_name: 'audit_trails',
    schema_name: 'public',
    ssl: false
  };

  public static save(env: DbConnection): void {
    Logger.log('Saving environment variables', Env.name);

    if (!env.port) env.port = this.defaults.port;
    if (!env.table_name) env.table_name = this.defaults.table_name;
    if (!env.schema_name) env.schema_name = this.defaults.schema_name;
    if (!env.ssl) env.ssl = this.defaults.ssl;

    Env.envs = env;
  }

  public static get(key: Lowercase<keyof DbConnection>): DbConnection[typeof key] {
    return Env.envs[key];
  }

  public static getAll(): DbConnection {
    Logger.log('Get all environment variables', Env.name);

    return Env.envs;
  }

  public static getDefaults(): Partial<DbConnection> {
    return Env.defaults;
  }

  public static nodeEnv(): string {
    return process.env.NODE_ENV as string;
  }
}
