import { Hono } from 'hono'
import { jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import * as schema from 'schema'
import { JWT_SECRET } from '../../main.ts'
import { createHTTPException, handleDBError, handleJWTError } from '../../utils/errors.ts'
import { vValidator } from '@hono/valibot-validator'
import { HeaderBearerSchema } from '../../valibot/comum.ts'
import dayjs from 'dayjs'

export default new Hono().get('/check', vValidator('header', HeaderBearerSchema), async (c) => {
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
  
  const [blacklist] = await db
    .select()
    .from(schema.jwt_blacklist)
    .where(eq(schema.jwt_blacklist.jti, payload.jti))

  if (blacklist) {
    throw createHTTPException(
      401,
      'Autenticação Expirada',
      'Token já está na lista de tokens invalidados.',
    )
  }

  const [usuario] = await db
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
    .catch((c) => handleDBError(c, 'Erro ao selecionar usuário no banco de dados.'))

  if (!usuario) {
    throw createHTTPException(
      401,
      'Usuário não encontrado',
      'usuario == undefined',
    )
  }

  if (usuario.permissao !== payload.permissao) {
    throw createHTTPException(
      401,
      'Permissão de Token diferente da permissão da Conta',
      'usuario.permissao !== payload.permissao',
    )
  }

  if (usuario.permissao === 'estagiario' && usuario.dataFim) {
    if (dayjs().isAfter(dayjs(usuario.dataFim))) {
      throw createHTTPException(
        401,
        'Período de estágio expirado.',
        'dataFim < data atual',
      )
    }
  }

  return c.json({
    message: 'Usuário autenticado com sucesso',
    usuario: usuario.permissao === 'admin'
      ? {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        permissao: 'admin',
      }
      : {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        permissao: 'estagiario',
        dataInicio: usuario.dataInicio,
        dataFim: usuario.dataFim,
      },
  }, 200)
})
