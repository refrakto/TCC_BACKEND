import { Hono } from 'hono'
import * as schema from 'database'
import { eq } from 'drizzle-orm'
import { verify } from '@node-rs/argon2'
import { SignJWT } from 'jose'
import { EmailSchema, SenhaSchema } from 'valibot/cadastro'
import { object } from 'valibot'
import { JWT_SECRET } from 'index'
import { jsonValidator } from 'utils/permissao'
import { createHTTPException, handleDBError } from 'utils/errors'

export const LoginRequestSchema = object({
  email: EmailSchema,
  senha: SenhaSchema,
})

export default new Hono().post(
  '/login',
  jsonValidator(LoginRequestSchema),
  async c => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const [usuario] = (
      await db
        .select()
        .from(schema.usuario)
        .where(eq(schema.usuario.email, body.email.toLowerCase().trim()))
        .catch(c => handleDBError(c, 'Erro ao selecionar usuário no banco de dados.')
          )
    )

    if (!usuario)
      throw createHTTPException(404, 'Usuário não encontrado.', 'usuario == undefined')

    if (!(await verify(usuario.senha, body.senha)))
      throw createHTTPException(401, 'Senha inválida.', 'Verificação de senha retornou falso.')

    const token = await new SignJWT({
      id: usuario.id,
      permissao: usuario.permissao,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    const valorFinal = {
      token,
      usuario:
        usuario.permissao === 'admin'
          ? {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              permissao: usuario.permissao,
            }
          : {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              permissao: usuario.permissao,
              dataInicio: usuario.dataInicio,
              dataFim: usuario.dataFim ?? undefined,
            },
    }

    return c.json(valorFinal)
  }
)
