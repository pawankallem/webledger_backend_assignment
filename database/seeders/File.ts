import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import File from 'App/Models/File'

export default class extends BaseSeeder {
  public async run() {
    await File.createMany([
      {
        fileName: 'file1.xls',
        filePath: './public/assets/Sheet 1.xlsx',
      },
      {
        fileName: 'file2.xls',
        filePath: './public/assets/Sheet 2.xlsx',
      },
    ])
  }
}
