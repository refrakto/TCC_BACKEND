import { Hono } from 'hono'
import * as schema from 'schema'
import { eq } from 'drizzle-orm'
import { verify } from '@felix/argon2'
import { SignJWT } from 'jose'
import { EmailSchema, SenhaSchema } from '../../valibot/cadastro.ts'
import { object } from 'valibot'
import { generateSecret, JWT_SECRET, DUMMY_HASH } from '../../main.ts'
import { jsonValidator } from '../../utils/permissao.ts'
import { createHTTPException, handleDBError } from '../../utils/errors.ts'

export const LoginRequestSchema = object({
  email: EmailSchema,
  senha: SenhaSchema,
})

export default new Hono().post(
  '/login',
  jsonValidator(LoginRequestSchema),
  async (c) => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const [usuario] = await db
      .select()
      .from(schema.usuario)
      .where(eq(schema.usuario.email, body.email.toLowerCase().trim()))
      .catch((c) => handleDBError(c, 'Erro ao selecionar usuário no banco de dados.'))

    if (!usuario) {
      await verify(DUMMY_HASH, body.senha) // Simula verificação
      throw createHTTPException(401, 'Credenciais inválidas.', 'Usuário não encontrado.')
    }

    if (!(await verify(usuario.senha, body.senha))) {
      throw createHTTPException(
        401,
        'Credenciais inválidas.',
        'Verificação de senha retornou falso.',
      )
    }

    const token = await new SignJWT({
      id: usuario.id,
      permissao: usuario.permissao,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(generateSecret())
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    return c.json({
      token,
      message: 'Usuário autenticado com sucesso',
      usuario: usuario.permissao === 'admin'
        ? {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          permissao: 'admin',
        }
        : {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          permissao: 'estagiario',
          dataInicio: usuario.dataInicio,
          dataFim: usuario.dataFim,
        },
    })
  },
)
