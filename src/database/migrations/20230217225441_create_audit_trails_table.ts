import { type Knex } from 'knex';
import { Env } from '../../utils/env';

const auditTrailTable = Env.get('table_name') as string;
const auditTrailSchema = Env.get('schema_name') as string;

export async function up (knex: Knex): Promise<void> {
  return await knex.transaction(async (trx: Knex.Transaction) =>
    await trx.schema
      .createSchemaIfNotExists(auditTrailSchema)
      .then(async () =>
        await trx.schema
          .hasTable(auditTrailTable)
          // @ts-expect-error
          .then((tableExists: boolean) => {
            if (!tableExists) {
              return trx.schema
                .withSchema(auditTrailSchema)
                .createTable(
                  auditTrailTable,
                  (tableBuilder: Knex.CreateTableBuilder) => {
                    tableBuilder
                      .uuid('id')
                      .unique()
                      .notNullable()
                      .defaultTo(knex.raw('gen_random_uuid()'))
                      .primary({ constraintName: `${auditTrailTable}_id` });
                    tableBuilder.uuid('performed_by').notNullable();
                    tableBuilder.uuid('performed_for');
                    tableBuilder.string('role').notNullable();
                    tableBuilder.string('endpoint').notNullable();
                    tableBuilder.text('action');
                    tableBuilder.string('description').notNullable();
                    tableBuilder.string('status').notNullable();
                    tableBuilder.string('status_code').notNullable();
                    tableBuilder.uuid('resource_id');
                    tableBuilder.string('resource');
                    tableBuilder.json('request_data');
                    tableBuilder.text('response_msg');
                    tableBuilder.timestamps(true, true);
                  }
                );
            }
          })
      )
      .catch((e: Error) => { console.error('MIGRATION_ERROR:', e.message); })
  );
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema
    .withSchema(auditTrailSchema)
    .dropTableIfExists(auditTrailTable);
}
