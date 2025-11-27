import { Hono } from 'hono'

import * as main from './main.exports.ts'
import auth from './api/auth/main.ts'
import chuva from './api/chuva/main.ts'
import contas from './api/contas/main.ts'
import pluvi from './api/pluvi/main.ts'

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

let servingMessage = `🚀 SIMP-IFRJ BACKEND iniciado com sucesso! \nServindo em: http://`

if (import.meta.main) {
  main.eventListeners()
  console.clear()
  Deno.serve({
    port: main.PORT,
    hostname: main.HOST,
    onListen: (address) => {
      servingMessage += `${main.simplificarLocalhost(address.hostname)}:${address.port}/`
      console.log(servingMessage)
    },
  }, app.fetch)
}

setInterval(async () => {
  try {
    await main.cleanBlacklist()
    console.log('Blacklist limpa com sucesso')
  } catch (error) {
    console.error('Erro ao limpar blacklist:', error)
  }
}, 24 * 60 * 60 * 1000)

//PÓS-EXECUÇÃO
await new Promise((r) => setTimeout(r, 1000))

let result = await main.args(Deno.args, main.DRIZZLE_STARTER)
if (result === 1) Deno.exit(1)
if (result === 22 || result === 23) {
  if (result === 23) console.log('\nOperação cancelada.\n')
  console.log(servingMessage)
  if (result === 22) console.log('\nConta de administrador criada com sucesso.')
}

console.log('\nDigite help para obter ajuda.')

let res
while (!(res === 'fechar' || res === 'sair' || res === 'stop' || res === 'exit')) {
  res = prompt('\n> ')
  switch (res) {
    case 'help':
      console.log(main.HELP_EXEC_TEMPLATE)
      break
    case 'init':
      result = await main.args(['--init'], main.DRIZZLE_STARTER)
      if (result === 22 || result === 23) {
        if (result === 23) console.log('\nOperação cancelada.\n')
        console.log(servingMessage)
        if (result === 22) console.log('\nConta de administrador criada com sucesso.')
      }
      break
    default:
      if (!(res === 'fechar' || res === 'sair' || res === 'stop' || res === 'exit')) {
        console.log('Comando inválido')
      }
      break
  }
}

Deno.exit(0)

export * from './main.exports.ts'
export type AppType = typeof app
