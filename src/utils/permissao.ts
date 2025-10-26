import { vValidator } from '@hono/valibot-validator'
import { JWT_SECRET } from 'index'
import { jwtVerify } from 'jose'
import { HeaderBearerSchema } from 'valibot/comum'
import * as schema from 'database'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { flatten, GenericSchema, GenericSchemaAsync, message } from 'valibot'
import { createHTTPException, handleDBError, handleJWTError } from './errors'

export const acesso = (permissaoPermitida: 'estagiario' | 'admin') =>
  vValidator('header', HeaderBearerSchema, async (result, c) => {
    if (!result.success)
      throw createHTTPException(422, {
        message: 'Formatação de Header inválida.',
        errors: flatten(result.issues),
      })

    const auth = result.output.authorization
    const token = auth.split(' ')[1]

    if (new TextEncoder().encode(token) === JWT_SECRET) return //para testar apis antes de criar um usuario admin com permissao (por exemplo a propria api de criar contas)

    const db = c.get('db')

      const { payload } = await jwtVerify(token, JWT_SECRET).catch(e => {throw handleJWTError(e)})
      const permissao = payload.permissao as string

      ;(
        await db
          .select()
          .from(schema.usuario)
          .where(eq(schema.usuario.id, payload.id as number))
          .catch(c => handleDBError(c, 'Erro ao selecionar usuário autenticado no banco de dados.'))
      )[0]

      c.set('acesso', payload)

      if (permissao === 'admin') return

      if (permissao !== permissaoPermitida) {
        throw createHTTPException(403, { message: 'Permissão negada.'}, 'Método restrito a Administradores.')
      }
  })

export const jsonValidator = <T extends GenericSchema | GenericSchemaAsync>(
  vSchema: T
) =>
  vValidator('json', vSchema, async result => {
    if (!result.success)
      throw new HTTPException(422, {
        message: 'Formatação de JSON inválida.',
        cause: result.issues,
      })
  })
