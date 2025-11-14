import '@std/dotenv/load'
import * as schema from '@/database/main.ts'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { hash } from '@felix/argon2'

export const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET'))

export const DB_USUARIO = Deno.env.get('DB_USUARIO')
export const DB_SENHA = Deno.env.get('DB_SENHA')
export const DB_NOME = Deno.env.get('DB_NOME')
export const DB_HOST = Deno.env.get('DB_HOST') ?? 'localhost'
export const DB_PORT = Deno.env.get('DB_PORT') ?? '5432'
export const DB_URL = `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`

export const DRIZZLE_STARTER = drizzle<typeof schema>(DB_URL)

export function checkDbConnection() {
  try {
    const pool = new Pool({ connectionString: DB_URL })
    pool.connect()
    pool.removeAllListeners()
  } catch (e) {
    throw new Error('Erro ao conectar ao banco de dados', { cause: e })
  }
}

export const DUMMY_HASH = await hash('dummy_password_12ß3¶4)56(*78/')

export function eventListeners() {
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
}