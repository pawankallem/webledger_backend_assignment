import { DateTime } from 'luxon'
import { BaseModel, column, Has, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Bank from 'App/Models/Bank'
import Address from 'App/Models/Address'

export default class Client extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public email?: string

  @column()
  public phoneNumber?: string

  @column()
  public pan?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Bank)
  public banks: HasMany<typeof Bank>

  @hasMany(() => Address)
  public addresses: HasMany<typeof Address>
}
