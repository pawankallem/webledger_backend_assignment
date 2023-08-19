import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('client_id').notNullable().unsigned().references('clients.id').onDelete('CASCADE')
      table.string('address_line_1').notNullable()
      table.string('address_line_2').nullable().defaultTo(null)
      table.string('city').notNullable()
      table.string('state').nullable().defaultTo(null)
      table.string('zip').nullable().defaultTo(null)

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
