import { vValidator } from '@hono/valibot-validator'
import { JWT_SECRET } from 'index'
import { jwtVerify } from 'jose'
import { HeaderBearerSchema } from 'valibot/comum'

export const acesso = (permissaoPermitida: 'estagiario' | 'admin') =>
  vValidator('header', HeaderBearerSchema, async (result, c) => {
    if (!result.success) return

    const auth = result.output.authorization
    const token = auth.split(' ')[1]

    
    if (new TextEncoder().encode(token) === JWT_SECRET) return

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const permissao = payload.permissao as string

      c.set('acesso', payload)

      if (permissao === 'admin') return

      if (permissao !== permissaoPermitida) {
        return c.json({ error: 'Permissão negada' }, 403)
      }
    } catch {
      return c.json({ error: 'Token inválido ou expirado' }, 401)
    }
  })
