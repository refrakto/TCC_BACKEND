import { defineConfig } from 'drizzle-kit'

const {
	DB_USUARIO,
	DB_SENHA,
	DB_NOME,
	DB_HOST = 'localhost',
	DB_PORT = '5432',
} = process.env

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/database/schema/**',
	dbCredentials: {
		url: `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`,
	},
})
