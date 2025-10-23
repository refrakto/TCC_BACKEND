import { vValidator } from '@hono/valibot-validator'
import { Hono } from 'hono'
import * as schema from 'database'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { verify } from '@node-rs/argon2'
import { SignJWT } from 'jose'
import { EmailSchema, SenhaSchema } from 'valibot/cadastro'
import { object } from 'valibot'
import { JWT_SECRET } from 'index'

export const LoginRequestSchema = object({
  email: EmailSchema,
  senha: SenhaSchema,
})

export default new Hono().post(
  '/',
  vValidator('json', LoginRequestSchema),
  async c => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const usuario = (
      await db
        .select()
        .from(schema.usuario)
        .where(eq(schema.usuario.email, body.email.toLowerCase().trim()))
    )[0]

    if (!usuario)
      return c.json({ error: 'Usuário não encontrado.' }, 401)

    if (!(await verify(usuario.senha, body.senha)))
      return c.json({ error: 'Senha inválida.' }, 401)

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
