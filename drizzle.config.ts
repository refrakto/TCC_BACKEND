import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import process from 'node:process'
const { DB_HOST = 'localhost', DB_NOME, DB_PORT = '5432', DB_SENHA, DB_USUARIO } = process.env

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/**',
  dbCredentials: {
    url: `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`,
  },
})
