import { Hono } from 'hono'
import { jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import * as schema from '@/database/main.ts'
import { JWT_SECRET } from '@/main.ts'
import { createHTTPException, handleDBError, handleJWTError } from '@/utils/errors.ts'
import { vValidator } from '@hono/valibot-validator'
import { HeaderBearerSchema } from '@/valibot/comum.ts'

export default new Hono().post('/logout', vValidator('header', HeaderBearerSchema), async (c) => {
  const db = c.get('db')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    throw createHTTPException(
      401,
      'Nenhum token providenciado',
      'Requisição sem Header ou sem token após Bearer.',
    )
  }

  const { payload } = await jwtVerify(token, JWT_SECRET).catch((e) => {
    throw handleJWTError(e)
  })
  const [usuario] = await db
    .select({ permissao: schema.usuario.permissao })
    .from(schema.usuario)
    .where(eq(schema.usuario.id, payload.id as number))
    .catch((c) => handleDBError(c, 'Erro ao selecionar usuário no banco de dados.'))

  if (!usuario) {
    throw createHTTPException(404, 'Usuário não encontrado', 'usuario == undefined')
  }

  if (usuario.permissao !== payload.permissao) {
    throw createHTTPException(
      401,
      'Permissão de Token diferente da permissão da Conta',
      'usuario.permissao !== payload.permissao',
    )
  }

  return c.json({ success: true, message: 'Desconectado com sucesso' })
})
