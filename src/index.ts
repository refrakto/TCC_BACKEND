import { drizzle } from 'drizzle-orm/bun-sql'
import { Hono } from 'hono'
import * as schema from './database'
import auth from 'api/auth'
import chuva from 'api/chuva'
import contas from 'api/contas'
import pluvi from 'api/pluvi'

export const {
  DB_USUARIO,
  DB_SENHA,
  DB_NOME,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
} = Bun.env

export const JWT_SECRET = new TextEncoder().encode(Bun.env.JWT_SECRET)

const app = new Hono()
.route('/', auth)
.route('/', chuva)
.route('/', contas)
.route('/', pluvi)

if (!DB_USUARIO || !DB_SENHA || !DB_NOME) {
  throw new Error(
    'As variáveis de ambiente do banco de dados devem ser definidas.'
  )
}

if (!JWT_SECRET) {
  throw new Error('O código para autenticação JWT deve ser definido.')
}

app.use('*', async (c, next) => {
  c.set(
    'db',
    drizzle<typeof schema>(
      `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`
    )
  )
  await next()
})

process.on('beforeExit', () => {
  console.log('🛑 Desligando Servidor...')
})

process.on('uncaughtException', error => {
  console.error('💥 Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

export type AppType = typeof app
export default app
