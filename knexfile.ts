import {Options, DbConnection, ConfigObject} from "./src/types/option";

class KnexFile {
    private readonly options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    private getConnection(): DbConnection {
        let { host, password, user, database, port, ssl } = this.options.connection;

        if (ssl === true) {
            ssl = {
                rejectUnauthorized: true,
            }
        } else if (ssl === false) {
            ssl = {
                rejectUnauthorized: false,
            }
        }

        const dbConnection: DbConnection = {
            host,
            user,
            password,
            database,
            port,
            ssl,
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
                max: 10,
            },
            migrations: {
                directory: './src/database/migrations',
                tableName: this.options.connection.tableName || 'auditTrails',
                extension: 'ts',
            },
            seeds: {
                directory: './src/database/seeds',
                extension: 'ts',
            },
        };
    }
}

module.exports = new KnexFile().getConfig();
