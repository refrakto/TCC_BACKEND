import { Hono } from 'hono'

import * as main from './main.exports.ts'
import auth from '@@/auth/main.ts'
import chuva from '@@/chuva/main.ts'
import contas from '@@/contas/main.ts'
import pluvi from '@@/pluvi/main.ts'

if (Deno.args.includes('-h') || Deno.args.includes('--help')) {
  console.log(main.HELP_TEMPLATE)
  Deno.exit(0)
}

await main.ensureEnvFile()

if (!main.JWT_SECRET) throw new Error('O código para autenticação JWT deve ser definido.')
if (!main.DB_USUARIO || !main.DB_SENHA || !main.DB_NOME) {
  throw new Error('As variáveis de ambiente do banco de dados devem ser definidas.')
}

main.checkDbConnection()

const app = new Hono()

app.use('*', async (c, next) => {
  c.set('db', main.DRIZZLE_STARTER)
  c.set('bypassJWT', Deno.args.includes('--test'))
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


//PÓS-EXECUÇÃO
await new Promise((r) => setTimeout(r, 1000))

main.args(Deno.args, main.DRIZZLE_STARTER)

export * from './main.exports.ts'
export type AppType = typeof app
export default app
