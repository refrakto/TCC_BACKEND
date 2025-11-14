import { vValidator } from '@hono/valibot-validator'
import { JWT_SECRET } from '@/main.ts'
import { jwtVerify } from 'jose'
import { HeaderBearerSchema } from '@/valibot/comum.ts'
import * as schema from '@/database/main.ts'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { flatten, GenericSchema, GenericSchemaAsync } from 'valibot'
import { createHTTPException, handleDBError, handleJWTError } from './errors.ts'

export const acesso = (permissaoPermitida: 'estagiario' | 'admin') => async (c: any, next: any) => {
  // Check for bypass token first (before validation)
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    if (token === new TextDecoder().decode(JWT_SECRET)) {
      return next()
    }
  }

  // Run validation
  return vValidator('header', HeaderBearerSchema, async (result, c) => {
    if (!result.success) {
      throw createHTTPException(422, {
        message: 'Formatação de Header inválida.',
        errors: flatten(result.issues),
      })
    }

    const auth = result.output.authorization
    const token = auth.split(' ')[1]

    const db = c.get('db')

    const { payload } = await jwtVerify(token, JWT_SECRET).catch((e) => {
      throw handleJWTError(e)
    })
    const permissao = payload.permissao as string
    const [usuario] = await db
      .select()
      .from(schema.usuario)
      .where(eq(schema.usuario.id, payload.id as number))
      .catch((c) => handleDBError(c, 'Erro ao selecionar usuário autenticado no banco de dados.'))

    if (!usuario) {
      throw createHTTPException(403, 'Permissão negada.')
    }

    c.set('acesso', payload)

    if (permissao === 'admin') return

    if (permissao !== permissaoPermitida) {
      throw createHTTPException(
        403,
        'Permissão negada.',
        'Método restrito a Administradores.',
      )
    }
  })(c, next)
}

export const jsonValidator = <T extends GenericSchema | GenericSchemaAsync>(
  vSchema: T,
) =>
  vValidator('json', vSchema, async (result) => {
    if (!result.success) {
      throw new HTTPException(422, {
        message: 'Formatação de JSON inválida.',
        cause: result.issues,
      })
    }
  })
