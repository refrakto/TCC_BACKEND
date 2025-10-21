import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { JwtTokenExpired, JwtTokenInvalid } from 'hono/utils/jwt/types'
import { jwtVerify } from 'jose'
import { JWTExpired, JWTInvalid } from 'jose/errors'
import { eq } from 'drizzle-orm'
import * as schema from 'database'
import { JWT_SECRET } from 'index'

export default new Hono().get('/', async c => {
  const db = c.get('db')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]

  if (!token)
    throw new HTTPException(401, { message: 'Nenhum token providenciado' })

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const usuario = (
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
    )[0]

    if (!usuario)
      throw new HTTPException(401, { message: 'Usuário não encontrado' })

    if (usuario.permissao !== payload.permissao)
      throw new HTTPException(401, {
        message: 'Permissão de Token diferente da permissão da Conta',
      })

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
  } catch (err) {
    switch (err) {
      case JWTInvalid:
        throw new JwtTokenInvalid(token)
      case JWTExpired:
        throw new JwtTokenExpired(token)
    }
    throw new HTTPException(401, { message: 'Token inválido' })
  }
})
