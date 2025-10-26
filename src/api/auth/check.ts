import { Hono } from 'hono'
import { jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import * as schema from 'database'
import { JWT_SECRET } from 'index'
import {
  createHTTPException,
  handleDBError,
  handleJWTError,
} from 'utils/errors'
import { vValidator } from '@hono/valibot-validator'
import { HeaderBearerSchema } from 'valibot/comum'

export default new Hono().get('/check',vValidator('header', HeaderBearerSchema), async c => {
  const db = c.get('db')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]

  if (!token)
    throw createHTTPException(401, 'Nenhum token providenciado', 'Requisição sem Header ou sem token após Bearer.')

  const { payload } = await jwtVerify(token, JWT_SECRET).catch(e => {
    throw handleJWTError(e)
  })

  const [usuario] = (
    await db
      .select({
        id: schema.usuario.id,
        nome: schema.usuario.nome,
        email: schema.usuario.email,
        permissao: schema.usuario.permissao,
        dataInicio: schema.usuario.dataInicio,
        dataFim: schema.usuario.dataFim,
      })
      .from(schema.usuario)
      .where(eq(schema.usuario.id, payload.id as number))
      .catch(c =>
        handleDBError(c, 'Erro ao selecionar usuário no banco de dados.')
      )
  )

  if (!usuario)
    throw createHTTPException(
      401,
      'Usuário não encontrado',
      'usuario == undefined'
    )

  if (usuario.permissao !== payload.permissao)
    throw createHTTPException(
      401,
      'Permissão de Token diferente da permissão da Conta',
      'usuario.permissao !== payload.permissao'
    )

  return c.json({
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
  })
})
