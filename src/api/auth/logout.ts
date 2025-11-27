import { Hono } from 'hono'
import { jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import * as schema from 'schema'
import { JWT_SECRET } from '../../main.ts'
import { createHTTPException, handleDBError, handleJWTError } from '../../utils/errors.ts'
import { vValidator } from '@hono/valibot-validator'
import { HeaderBearerSchema } from '../../valibot/comum.ts'

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

  if (!payload.jti) {
    throw createHTTPException(
      401,
      'Autenticação não identificada.',
      'Token não possui ID de sessão.',
    )
  }

  const [blacklist] = await db.select().from(schema.jwt_blacklist).where(
    eq(schema.jwt_blacklist.jti, payload.jti),
  )

  if (blacklist) {
    throw createHTTPException(
      401,
      'Autenticação já foi invalidada',
      'Token já está na lista de tokens invalidados.',
    )
  }

  const [usuario] = await db
    .select({ permissao: schema.usuario.permissao })
    .from(schema.usuario)
    .where(eq(schema.usuario.id, payload.id as number))
    .catch((c) => handleDBError(c, 'Erro ao selecionar usuário no banco de dados.'))

  if (!usuario) {
    throw createHTTPException(404, 'Usuário não encontrado')
  }

  if (usuario.permissao !== payload.permissao) {
    throw createHTTPException(
      401,
      'Permissão de Token diferente da permissão da Conta',
      'usuario.permissao !== payload.permissao',
    )
  }

  await db
    .insert(schema.jwt_blacklist)
    .values({ jti: payload.jti })
    .catch((e) => {
      throw handleDBError(e, 'Erro ao inserir token na blacklist')
    })

  return c.json({ message: 'Autenticação invalidada com sucesso' }, 200)
})
