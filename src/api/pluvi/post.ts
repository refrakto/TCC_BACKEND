import { Hono } from 'hono'
import { acesso, jsonValidator } from '../../utils/permissao.ts'
import { PluviometroSchema } from '../../valibot/pluvi.ts'
import * as schema from 'schema'
import { eq } from 'drizzle-orm'
import { createHTTPException, handleDBError } from '../../utils/errors.ts'

export default new Hono().post(
  '/',
  acesso('admin'),
  jsonValidator(PluviometroSchema),
  async (c) => {
    const body = c.req.valid('json')
    const db = c.get('db')

    const existente = await db
      .select()
      .from(schema.pluviometro)
      .where(eq(schema.pluviometro.nome, body.nome))
      .catch((c) => handleDBError(c, 'Erro ao buscar pluviometro existente no banco de dados.'))

    if (existente.length) {
      throw createHTTPException(400, `Pluviometro com nome ${existente[0].nome} já cadastrado.`)
    }

    const novo = await db.transaction(async (tx) => {
      const result = await tx
        .insert(schema.pluviometro)
        .values(body)
        .returning()
        .catch((c) => handleDBError(c, 'Erro ao inserir pluviometro no banco de dados.'))

      if (!result.length) {
        throw createHTTPException(500, 'Erro ao inserir pluviometro no banco de dados.')
      }

      return result[0]
    })

    return c.json({
      message: 'Pluviômetro cadastrado com sucesso.',
      pluvi: novo,
    }, 201)
  },
)
