import '@std/dotenv/load'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Hono } from 'hono'

import * as schema from '@/database/main.ts'

import auth from '@@/auth/main.ts'
import chuva from '@@/chuva/main.ts'
import contas from '@@/contas/main.ts'
import pluvi from '@@/pluvi/main.ts'

export const DB_USUARIO = Deno.env.get('DB_USUARIO')
export const DB_SENHA = Deno.env.get('DB_SENHA')
export const DB_NOME = Deno.env.get('DB_NOME')
export const DB_HOST = Deno.env.get('DB_HOST') ?? 'localhost'
export const DB_PORT = Deno.env.get('DB_HOST') ?? '5432'

export const JWT_SECRET = new TextEncoder().encode(
  Deno.env.get('JWT_SECRET'),
)

if (!DB_USUARIO || !DB_SENHA || !DB_NOME) {
  throw new Error('As variáveis de ambiente do banco de dados devem ser definidas.')
}

if (!JWT_SECRET) {
  throw new Error('O código para autenticação JWT deve ser definido.')
}

const app = new Hono()
  .route('/', auth)
  .route('/', chuva)
  .route('/', contas)
  .route('/', pluvi)

app.use('*', async (c, next) => {
  c.set(
    'db',
    drizzle<typeof schema>(
      `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`,
    ),
  )
  await next()
})

addEventListener('unload', () => {
  console.log('🛑 Desligando Servidor...')
})

addEventListener('error', (event) => {
  console.error('💥 Uncaught exception:', event.error)
  Deno.exit(1)
})

addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled rejection:', event.reason)
  Deno.exit(1)
})

Deno.serve(app.fetch)

export type AppType = typeof app
export default app
