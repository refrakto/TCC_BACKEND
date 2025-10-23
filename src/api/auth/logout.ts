import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { JwtTokenExpired, JwtTokenInvalid } from 'hono/utils/jwt/types'
import { jwtVerify } from 'jose'
import { JWTExpired, JWTInvalid } from 'jose/errors'
import { eq } from 'drizzle-orm'
import * as schema from 'database'
import { JWT_SECRET } from 'index'

export default new Hono().post('/', async c => {
  const db = c.get('db')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]

  if (!token)
    throw new HTTPException(401, { message: 'Nenhum token providenciado' })

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const usuario = (
      await db
        .select({ permissao: schema.usuario.permissao })
        .from(schema.usuario)
        .where(eq(schema.usuario.id, payload.id as number))
    )[0]

    if (!usuario)
      throw new HTTPException(401, { message: 'Usuário não encontrado' })

    if (usuario.permissao !== payload.permissao)
      throw new HTTPException(401, {
        message: 'Permissão de Token diferente da permissão da Conta',
      })

    return c.json({ success: true, message: 'Desconectado com sucesso' })
  } catch (err: any) {
    if (err === HTTPException)
      return c.json({ error: 'Erro ao Desconectar: ' + err.message }, 401)

    return c.json({ error: 'Token Inválido' }, 401)
  }
})
