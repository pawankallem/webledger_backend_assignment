import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import File from 'App/Models/File'
// import Client from 'App/Models/Client'
// import Bank from 'App/Models/Bank'
// import Address from 'App/Models/Address'

export default class ExcelProcessesController {
  public async process(ctx: HttpContextContract) {
    const files = await File.query().orderBy('id').limit(2)
    // const files = await File.all()
    return ctx.response.json({ message: 'Hello Candidate, please validate and sanitize the data before store data into the database', files })
  }
}
