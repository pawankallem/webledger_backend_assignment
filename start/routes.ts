import Route from '@ioc:Adonis/Core/Route'

Route.get('/', (ctx) => ctx.view.render('welcome'))

Route.group(() => {
  Route.get('process', 'ExcelProcessesController.process')
}).prefix('api/v1')
