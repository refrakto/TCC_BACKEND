import { Hono } from 'hono'
import { acesso, jsonValidator } from '@/utils/permissao.ts'
import { intersect } from 'valibot'
import { PluviometroSchema, SelectPluviSchema } from '@/valibot/pluvi.ts'
import * as schema from '@/database/main.ts'
import { createHTTPException, handleDBError } from '@/utils/errors.ts'
import { eq, inArray } from 'drizzle-orm'

export const PatchPluviSchema = intersect([
  SelectPluviSchema,
  PluviometroSchema,
])

export default new Hono().patch(
  '/',
  acesso('admin'),
  jsonValidator(PatchPluviSchema),
  async (c) => {
    const db = c.get('db')
    const { id, ...bodySemId } = c.req.valid('json')

    const existente = await db
      .select()
      .from(schema.pluviometro)
      .where(eq(schema.pluviometro.id, id))
      .catch((c) => handleDBError(c, 'Erro ao buscar pluviômetro no banco de dados.'))

    if (!existente.length) {
      throw createHTTPException(404, 'Pluviômetro não encontrado')
    }

    if (bodySemId.capacidadeLitros < existente[0].capacidadeLitros) {
      const medicoesExistentes = await db
        .select()
        .from(schema.medicao)
        .where(eq(schema.medicao.idPluvi, id))
        .catch((c) => handleDBError(c, 'Erro ao buscar medições no banco de dados.'))

      if (medicoesExistentes.length) {
        const chuvasId: number[] = []
        medicoesExistentes.forEach((m) => {
          if (m.quantidadeLitros > bodySemId.capacidadeLitros) {
            chuvasId.push(m.idChuva)
          }
        })

        if (chuvasId.length) {
          const chuvasData = (await db
            .select({ data: schema.chuva.data })
            .from(schema.chuva)
            .where(inArray(schema.chuva.id, chuvasId))
            .catch((c) => handleDBError(c, 'Erro ao buscar chuvas no banco de dados.'))).map((c) =>
              `"${c.data}"`
            )

          throw createHTTPException(
            400,
            `Chuvas nas datas a seguir registram mais litros do que a capacidade nova: ${
              chuvasData.join(', ')
            }`,
          )
        }
      }
    }

    const atualizado = await db.transaction(async (tx) => {
      const result = await tx
        .update(schema.pluviometro)
        .set(bodySemId)
        .where(eq(schema.pluviometro.id, id))
        .returning()
        .catch((c) => handleDBError(c, 'Erro ao atualizar pluviômetro no banco de dados.'))
      
      if (!result.length) {
        throw createHTTPException(500, 'Erro ao atualizar pluviômetro no banco de dados.')
      }
      
      return result[0]
    })
    
    return c.json({
      message: 'Pluviômetro atualizado com sucesso',
      pluvi: atualizado,
    }, 200)
  },
)
