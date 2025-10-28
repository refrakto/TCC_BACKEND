import { drizzle } from 'drizzle-orm/bun-sql'
import { Hono } from 'hono'
import * as schema from '@/database/main.ts'

const app = new Hono()

export const {
  DB_USUARIO,
  DB_SENHA,
  DB_NOME,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
} = Bun.env
export const JWT_SECRET = new TextEncoder().encode(Bun.env.JWT_SECRET)

if (!DB_USUARIO || !DB_SENHA || !DB_NOME) {
  throw new Error(
    'As variáveis de ambiente do banco de dados devem ser definidas.',
  )
}

if (!JWT_SECRET) {
  throw new Error('O código para autenticação JWT deve ser definido.')
}

app.use('*', async (c, next) => {
  c.set(
    'db',
    drizzle<typeof schema>(
      `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`,
    ),
  )
  await next()
})

function generateRoutePath(filePath: string): string | null {
  try {
    const relativePath = filePath
      .replace(/\\/g, '/')
      .replace(/^.*\/api/, '')
      .replace(/\/index\.(ts|js)$/, '/')
      .replace(/\.(ts|js)$/, '')
      .replace(/\[(.+?)\]/g, ':$1')

    if (!relativePath.match(/^[a-zA-Z0-9\/:_-]*$/)) {
      console.warn(`⚠️  Path de rota inválido ignorado: ${relativePath}`)
      return null
    }

    return relativePath || '/'
  } catch (error) {
    console.error(`❌ Erro ao gerar path para ${filePath}:`, error)
    return null
  }
}

async function loadRoutes() {
  try {
    // Use Bun.glob instead of glob package
    const glob = new Bun.Glob('src/api/**/*.{ts,js}')
    const files = Array.from(
      glob.scanSync({ cwd: process.cwd(), absolute: false, onlyFiles: true }),
    ).filter(
      (file) =>
        !file.includes('.test.') &&
        !file.includes('.spec.') &&
        !file.includes('__tests__') &&
        !file.endsWith('\\post.ts') &&
        !file.endsWith('\\get.ts') &&
        !file.endsWith('\\patch.ts'),
    )

    console.log(`📁 Encontrados ${files.length} arquivos de rota`)

    for (const file of files) {
      try {
        // Use dynamic import with Bun's module resolution
        const routeModule = await import(process.cwd() + '/' + file)

        if (!routeModule.default || typeof routeModule.default !== 'object') {
          console.warn(
            `⚠️  Arquivo ignorado (sem export default válido): ${file}`,
          )
          continue
        }

        const routePath = generateRoutePath(file)

        if (routePath === null) continue

        app.route(routePath, routeModule.default)
        console.log(`✅ Rota registrada: ${routePath}`)
      } catch (error) {
        console.error(`❌ Erro ao carregar rota ${file}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Erro crítico ao carregar rotas:', error)
    process.exit(1)
  }
}

export async function startServer() {
  await loadRoutes()

  const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 3000

  return {
    port,
    fetch: app.fetch,
    development: Bun.env.NODE_ENV !== 'production',
  }
}

// Graceful shutdown using Bun process events
process.on('beforeExit', () => {
  console.log('🛑 Desligando Servidor...')
})

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

if (import.meta.main) {
  try {
    const serverConfig = await startServer()

    const server = Bun.serve({
      port: serverConfig.port,
      fetch: serverConfig.fetch,
      development: serverConfig.development,
    })

    console.log(`📊 Ambiente: ${Bun.env.NODE_ENV || 'desenvolvimento'}`)
  } catch (error) {
    console.error('💥 Falha na inicialização:', error)
    process.exit(1)
  }
}

export type AppType = typeof app
export default app
