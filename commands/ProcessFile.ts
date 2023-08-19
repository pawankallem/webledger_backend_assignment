import { BaseCommand } from '@adonisjs/core/build/standalone'
import File from 'App/Models/File'

export default class ProcessFile extends BaseCommand {
  public static commandName = 'process:file'

  public static description = 'process excel file into database'

  public static settings = {
    loadApp: true,
  }

  public async run() {
    const { default: FileModel } = await import('App/Models/File')
    const files = await FileModel.query().orderBy('id').limit(1)
    this.processFile(files)
  }

  public async processFile(files: File[]) {
    //Write your code here, you should comment below line.
    this.logger.info(JSON.stringify(files, null, 2))
  }
}
