import * as schema from 'database'
import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { createHTTPException, handleDBError } from 'utils/errors'
import { acesso, jsonValidator } from 'utils/permissao'
import { intersect, object } from 'valibot'
import { ArrayMedicoesSchema, SelectChuvaSchema } from 'valibot/chuva'

export const PatchChuvaSchema = intersect([
  SelectChuvaSchema,
  object({ medicoes: ArrayMedicoesSchema }),
])

export default new Hono().patch(
  '/',
  acesso('estagiario'),
  jsonValidator(PatchChuvaSchema),
  async c => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const usaData = 'data' in body

    const [chuvaExistente] = await db
      .select()
      .from(schema.chuva)
      .where(
        usaData
          ? eq(schema.chuva.data, body.data)
          : eq(schema.chuva.id, body.id)
      )
      .catch(c =>
        handleDBError(c, 'Erro ao selecionar chuva no banco de dados.')
      )

    if (!chuvaExistente) {
      throw usaData
        ? createHTTPException(
            404,
            `Chuva na data ${body.data} não encontrada.`,
            `Data ${body.data} não identificada na tabela chuva do banco de dados.`
          )
        : createHTTPException(
            404,
            `Chuva com id ${body.id} não encontrada.`,
            `Id ${body.id} não identificado na tabela chuva do banco de dados.`
          )
    }

    const medicoes = await db
      .select()
      .from(schema.medicao)
      .where(eq(schema.medicao.idChuva, chuvaExistente.id))
      .catch(c =>
        handleDBError(c, 'Erro ao selecionar medições no banco de dados.')
      )

    const mExistentesIdPluvi = medicoes.map(m => m.idPluvi)

    const mAtualizadasIdPluvi = body.medicoes.map(m => m.idPluvi)

    // Verifica se não removeram nenhum pluviômetro
    const pluviometrosRemovidos = mExistentesIdPluvi.filter(
      id => !mAtualizadasIdPluvi.includes(id)
    )

    // Verifica se não adicionaram nenhum pluviômetro
    const pluviometrosAdicionados = mAtualizadasIdPluvi.filter(
      id => !mExistentesIdPluvi.includes(id)
    )

    if (pluviometrosRemovidos.length || pluviometrosAdicionados.length) {
      throw createHTTPException(
        400,
        {
          message:
            'Não é permitido alterar quais pluviômetros registraram essa chuva.',
          removidos: pluviometrosRemovidos,
          adicionados: pluviometrosAdicionados,
        },
        'Array de pluviômetros do pedido não equivale aos pluviômetros originais'
      )
    }

    const pluvis = await db
      .select()
      .from(schema.pluviometro)
      .where(inArray(schema.pluviometro.id, mAtualizadasIdPluvi))
      .catch(c =>
        handleDBError(c, 'Erro ao selecionar pluviometros no banco de dados.')
      )

    const errors: object[] = []

    for (const [i, m] of body.medicoes.entries()) {
      const pluvi = pluvis.find(p => p.id === m.idPluvi)!

      if (m.quantidadeMm > pluvi.capacidadeMm)
        errors.push(
          await createHTTPException(
            400,
            `Medição de índice ${i} tem medida maior que capacidade do pluviômetro.`
          )
            .getResponse()
            .json()
        )
    }

    if (errors.length) {
      throw createHTTPException(400, {
        message: 'Medições incoerentes com pluviômetros selecionados',
        errors,
      })
    }

    const compareMedicao = (idPluvi: number, idChuva: number) =>
      and(
        eq(schema.medicao.idChuva, idChuva),
        eq(schema.medicao.idPluvi, idPluvi)
      )

    const medicoesAtualizadas = await db.transaction(async tx => {
      const updates = []

      for (const m of body.medicoes) {
        const [medicaoAtualizada] = await tx
          .update(schema.medicao)
          .set({ quantidadeMm: m.quantidadeMm })
          .where(compareMedicao(m.idPluvi, chuvaExistente.id))
          .returning()
          .catch(c =>
            handleDBError(c, 'Erro ao atualizar medição no banco de dados.')
          )

        updates.push(medicaoAtualizada)
      }

      return updates
    })

    let media: number = 0

    for (const medicao of medicoesAtualizadas) {
        media += medicao.quantidadeMm
      }
      media = Math.round((media + Number.EPSILON) * 100) / 100

    return c.json(
      {
        message: 'Chuva atualizada com sucesso.',
        chuva: { ...chuvaExistente, media, medicoes: medicoesAtualizadas },
      },
      200
    )
  }
)
