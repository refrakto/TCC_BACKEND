import { defineConfig } from 'drizzle-kit'
import { DB_HOST, DB_NOME, DB_PORT, DB_SENHA, DB_USUARIO } from 'index'

export default defineConfig({
	dialect: 'postgresql',
	schema: './server/database/schema/**',
	dbCredentials: {
		url: `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`,
	},
})
