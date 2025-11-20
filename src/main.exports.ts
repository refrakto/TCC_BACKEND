import '@std/dotenv/load'
import * as schema from 'schema'
import * as path from '@std/path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { hash } from '@felix/argon2'
import { parse } from 'valibot'
import { EmailSchema, SenhaSchema } from './valibot/cadastro.ts'
import { eq } from 'drizzle-orm'
import { NomeSchema } from './valibot/comum.ts'

export const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET'))

export const DB_HOST = Deno.env.get('DB_HOST') ?? 'localhost'
export const DB_PORT = Deno.env.get('DB_PORT') ?? '5432'
export const DB_USUARIO = Deno.env.get('DB_USUARIO')
export const DB_SENHA = Deno.env.get('DB_SENHA')
export const DB_NOME = Deno.env.get('DB_NOME')
export const DB_URL = `postgresql://${DB_USUARIO}:${DB_SENHA}@${DB_HOST}:${DB_PORT}/${DB_NOME}`

export const DUMMY_HASH = await hash('dummy_password_12ß3¶4)56(*78/')

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

export async function args(args: string[], db: typeof DRIZZLE_STARTER) {
  const init = args.includes('--init')
  const test = args.includes('--test')
  
  const envPath = path.join(Deno.cwd(), '.env');
  const initEnv = Deno.env.get('INIT')
  
  if (initEnv !== undefined) {
    let res
    while( !(res === 's' || res === 'n' || res === 'sim' || res === 'nao') ) {
      console.clear()
      console.log('Primeiro admin já foi criado.')
      res = prompt('Deseja criar outro admin? (sim/nao): ')
    }
    if (res === 's' || res === 'sim') {
      await db.delete(schema.usuario).where(eq(schema.usuario.id, Number.parseInt(initEnv)))
      const textoExistente = await Deno.readTextFile(envPath);
      const linhas = textoExistente.split("\n");
      const linhasFiltradas = linhas.filter(l => !l.includes('INIT'));
      const textoNovo = linhasFiltradas.join("\n");
      await Deno.writeTextFile(envPath, textoNovo);
    } else return
  }

  if (init) {
    if (!db) {
      console.error('Falha ao conectar ao banco de dados.')
      Deno.exit(1)
    }

    let nome, email, senha

    try {
      email = parse(EmailSchema, prompt('Digite seu email: ')).trim()
    } catch {
      console.error('Falha ao validar o email.')
      console.log('Insira um email válido. Exemplo: email@endereco.com')
      Deno.exit(1)
    }

    const existente = await db.select().from(schema.usuario).where(eq(schema.usuario.email, email))
    if (existente.length) {
      console.error('Email já cadastrado.')
      Deno.exit(1)
    }

    try {
      nome = parse(NomeSchema, prompt('Digite seu nome: ')).trim()
    } catch {
      console.error('Falha ao validar o email.')
      console.log('Insira até 100 caracteres para o nome.')
      Deno.exit(1)
    }

    try {
      senha = await hash(parse(SenhaSchema, prompt('Digite sua senha: ')).trim())
    } catch {
      console.error('Falha ao validar a senha.')
      console.log('Insira ao menos 8 caracteres, até 100.')
      Deno.exit(1)
    }

    const [{ id }] = await db.insert(schema.usuario).values({
      nome,
      email,
      senha,
      permissao: 'admin',
    }).returning()

    const textoExistente = await Deno.readTextFile(envPath);
    const textoNovo = textoExistente.trimEnd() + "\n\n" + `INIT=${id}`;
    await Deno.writeTextFile(envPath, textoNovo);
    console.log('Conta de administrador criada com sucesso.')
  }

  if (test) {
    const testResult = await new Deno.Command(Deno.execPath(), {
      args: ['test', '-A', 'src/main.test.ts'],
      stdout: 'inherit',
      stderr: 'inherit',
    }).output()

    if (testResult.code !== 0) {
      console.error('Falha ao executar os testes.')
      Deno.exit(1)
    }

    Deno.exit(0)
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stats = await Deno.stat(path)
    // It exists, and we check if it's actually a file (not a directory)
    return stats.isFile
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false // File not found, which is what we are looking for
    }
    // Re-throw other errors (e.g., PermissionDenied)
    throw error
  }
}

function generateSecret(): string {
  // Cria um Uint8Array para armazenar os bytes aleatórios
  const randomBytes = new Uint8Array(48)

  // Preenche o array com valores aleatórios criptograficamente seguros
  crypto.getRandomValues(randomBytes)

  // Codifica o código binário em uma string Base64Url
  return btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '') // Remove caracteres de preenchimento '='
}

export async function ensureEnvFile() {
  const envPath = path.join(Deno.cwd(), '.env')

  if (!await fileExists(envPath)) {
    console.log(`arquivo .env não encontrado. Criando um novo...`)
    try {
      // Create the file with the default content
      await Deno.writeTextFile(envPath, DOTENV_TEMPLATE(generateSecret()))
      console.log(`"${envPath}" criado com sucesso.`)
      console.log(
        'Lembre-se de preencher as variáveis de ambiente com a configuração do seu banco de dados.',
      )
      console.log('Encerrando programa...')
      Deno.exit(0)
    } catch (error) {
      console.error(`Falha ao criar ${envPath}.`)
      console.error(error)
    }
  }
}

export const HELP_TEMPLATE = `
TCC-PLUVI BACKEND

Certifique de que o banco de dados esteja configurado corretamente.

Opções:
  -h, --help    Mostra essa ajuda.
  --test        Executa os testes automatizados.
  --init        Cria a primeira conta de administrador.
`

const DOTENV_TEMPLATE = (JWT_SECRET: string) =>
  `# TCC-PLUVI --- Variáveis de Ambiente

# Configuração do banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=exemplousuario
DB_SENHA=exemplosenha
DB_NOME=exemplonome

# Segredo do JWT (usado para criptografar sessões.)
# Não altere esse valor se não souber o que tiver fazendo.
# Gerado automaticamente pelo sistema.
JWT_SECRET=${JWT_SECRET}
`
