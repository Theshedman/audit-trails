export type Options = {
    connection: DbConnection;
}

export type DbConnection = {
    port: number;
    host: string;
    user: string;
    password: string;
    database: string;
    schemaName?: string;
    tableName?: string;
    ssl?: boolean | DbSSL;
}

export type DbSSL = {
    rejectUnauthorized: boolean;
}

export interface Pool {
    min: number;
    max: number;
  }
  
  export interface Migrations {
    directory: string;
    tableName: string;
    extension: string;
  }
  
  export interface Seeds {
    directory: string;
    extension: string;
  }
  
  export interface ConfigObject {
    searchPath: string;
    client: string;
    connection: DbConnection;
    pool: Pool;
    migrations: Migrations;
    seeds: Seeds;
    debug?: boolean;
  }
