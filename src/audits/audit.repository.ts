import { type Knex } from 'knex';

import { Env } from '../utils/env.js';
import { Logger } from './audit.logger.js';
import { AuditEvent } from './audit.event.js';
import { type KnexFile } from '../database/knexfile.js';
import type { AuditQueryFilter, AuditTrailProps, Pagination } from '../types/index.js';

export class AuditRepository extends AuditEvent {
  private readonly dbInstance: Knex;
  constructor(knexFile: KnexFile) {
    Logger.log('Initializing instance', AuditRepository.name);

    super();

    this.dbInstance = knexFile.getDBInstance();
    this.on(this.getEvent()['SAVE-SUCCESS'], (data: AuditTrailProps) => {
      Logger.log(`Audit Trail with an ID: ${data.id as string} saved successfully`, AuditRepository.name);
    });
  }

  public async save(data: AuditTrailProps): Promise<void> {
    Logger.log('Saving new audit trail');

    await this.dbInstance.transaction(async (trx) => {
      const auditTrailTable = Env.get('table_name') as string;
      const auditTrailSchema = Env.get('schema_name') as string;
      const fieldsToReturn = ['id', ...Object.keys(data), 'created_at', 'updated_at'];

      const newAuditTrail = await trx(`${auditTrailSchema}.${auditTrailTable}`)
        .insert(data, fieldsToReturn);

      // Emit an even for the successfully newly saved audit trail;
      this.emit(this.getEvent()['SAVE-SUCCESS'], newAuditTrail[0]);
    });
  }

  public async getAll(queryFilter?: AuditQueryFilter, pagination?: Pagination): Promise<AuditTrailProps[]> {
    Logger.log('Query audit trail records', AuditRepository.name);

    return await this.dbInstance.transaction(async (trx) => {
      const auditTrailTable = Env.get('table_name') as string;
      const auditTrailSchema = Env.get('schema_name') as string;

      let query = trx(`${auditTrailSchema}.${auditTrailTable}`).select().orderBy('created_at', 'desc');

      if (queryFilter != null) {
        const dateFilter = queryFilter.date_range;

        delete queryFilter.date_range;

        if (dateFilter) {
          query = query.whereBetween('created_by', [dateFilter.start_date, dateFilter.end_date]);
        }

        for (const filterKey of Object.keys(queryFilter)) {
          query = query.whereILike(filterKey, `%${filterKey}%`);
        }
      }

      return await this.paginateQuery(query, pagination as Pagination);
    });
  }

  private async paginateQuery(query: Knex.QueryBuilder, pagination: Pagination): Promise<any> {
    Logger.log('Paginate query', AuditRepository.name);

    const DEFAULT_PAGE = 1;
    const DEFAULT_SIZE = 10;

    // Todo: to be implemented later
    if (!pagination) {
      pagination = { page: DEFAULT_PAGE, size: DEFAULT_SIZE };

      pagination.page = DEFAULT_PAGE;
    }

    return await query;
  }
}
