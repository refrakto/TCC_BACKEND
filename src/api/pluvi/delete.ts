import { Hono } from 'hono'
import { acesso, jsonValidator } from '../../utils/permissao.ts'
import { SelectPluviSchema } from '../../valibot/pluvi.ts'
import * as schema from 'schema'
import { eq } from 'drizzle-orm'
import { createHTTPException, handleDBError } from '../../utils/errors.ts'

export default new Hono().delete(
  '/',
  acesso('admin'),
  jsonValidator(SelectPluviSchema),
  async (c) => {
    const { id } = c.req.valid('json')
    const db = c.get('db')

    const existente = await db
      .select()
      .from(schema.pluviometro)
      .where(eq(schema.pluviometro.id, id))
      .catch((c) => handleDBError(c, 'Erro ao buscar pluviômetro no banco de dados.'))

    if (!existente.length) {
      throw createHTTPException(404, 'Pluviômetro não encontrado')
    }

    const medicoesExistentes = await db
      .select()
      .from(schema.medicao)
      .where(eq(schema.medicao.idPluvi, id))
      .catch((c) => handleDBError(c, 'Erro ao buscar medições no banco de dados.'))

    if (medicoesExistentes.length) {
      throw createHTTPException(
        400,
        'Não é possível excluir um pluviômetro que já registrou chuvas. Edite ele para que seja arquivado.',
      )
    }

    const deletado = await db.transaction(async (tx) => {
      const result = await tx
        .delete(schema.pluviometro)
        .where(eq(schema.pluviometro.id, id))
        .returning()
        .catch((c) => handleDBError(c, 'Erro ao excluir pluviômetro no banco de dados.'))

      if (!result.length) {
        throw createHTTPException(500, 'Erro ao excluir pluviômetro no banco de dados.')
      }

      return result[0]
    })

    return c.json({
      message: 'Pluviômetro deletado com sucesso.',
      pluvi: deletado,
    }, 200)
  },
)
