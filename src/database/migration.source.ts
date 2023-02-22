import { Logger } from '../audits/audit.logger';

export class MigrationSource {

  private readonly _migrations: Promise<any>;

  constructor() {
    Logger.log('Initializing instance', MigrationSource.name);

    this._migrations = import('./migrations/20230217225441_create_audit_trails_table.js');
  }

  public async getMigrations(): Promise<string[]> {
    return ['20230217225441_create_audit_trails_table.js'];
  }

  public getMigrationName(migration: string): string {
    return migration;
  }

  public async getMigration(migration: any): Promise<any> {
    const { up, down } = await this._migrations;

    return { up, down };
  }
}
