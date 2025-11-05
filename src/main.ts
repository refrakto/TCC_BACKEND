import { Hono } from 'hono'

import * as main from './main.exports.ts'
import auth from '@@/auth/main.ts'
import chuva from '@@/chuva/main.ts'
import contas from '@@/contas/main.ts'
import pluvi from '@@/pluvi/main.ts'

if (!main.JWT_SECRET) throw new Error('O código para autenticação JWT deve ser definido.')
if (!main.DB_USUARIO || !main.DB_SENHA || !main.DB_NOME) {
  throw new Error('As variáveis de ambiente do banco de dados devem ser definidas.')
}

main.checkDbConnection()

const app = new Hono()

app.use('*', async (c, next) => {
  c.set('db', main.DRIZZLE_STARTER)
  await next()
})

app
  .route('/', auth)
  .route('/', chuva)
  .route('/', contas)
  .route('/', pluvi)

if (import.meta.main) {
  main.eventListeners()
  Deno.serve(app.fetch)
}

export * from './main.exports.ts'
export type AppType = typeof app
export default app
