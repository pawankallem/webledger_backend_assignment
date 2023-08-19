import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'banks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('client_id').notNullable().unsigned().references('clients.id').onDelete('CASCADE')
      table.string('bank_name').notNullable()
      table.string('account_holder_name').notNullable()
      table.string('account_number').notNullable()
      table.string('ifsc_code').nullable().defaultTo(null)
      table.string('address').nullable().defaultTo(null)
      table.string('city').nullable().defaultTo(null)

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
