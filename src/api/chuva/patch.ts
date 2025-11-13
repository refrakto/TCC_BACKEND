import * as schema from '@/database/main.ts'
import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { createHTTPException, handleDBError } from '@/utils/errors.ts'
import { acesso, jsonValidator } from '@/utils/permissao.ts'
import { intersect, object } from 'valibot'
import { ArrayMedicoesSchema, SelectChuvaSchema } from '@/valibot/chuva.ts'

export const PatchChuvaSchema = intersect([
  SelectChuvaSchema,
  object({ medicoes: ArrayMedicoesSchema }),
])

export default new Hono().patch(
  '/',
  acesso('estagiario'),
  jsonValidator(PatchChuvaSchema),
  async (c) => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const usaData = body.data ? true : false;
    const usaId = body.id ? true : false;
    
    const compare = usaData ? eq(schema.chuva.data, body.data!) : eq(schema.chuva.id, body.id!)

    const [chuvaExistente] = await db
      .select()
      .from(schema.chuva)
      .where(compare)
      .catch((c) => handleDBError(c, 'Erro ao buscar chuva no banco de dados.'))

    if (!chuvaExistente) {
      throw usaData
        ? createHTTPException(
          404,
          `Chuva na data ${body.data} não encontrada.`,
          `Data ${body.data} não identificada na tabela chuva do banco de dados.`,
        )
        : createHTTPException(
          404,
          `Chuva com id ${body.id} não encontrada.`,
          `Id ${body.id} não identificado na tabela chuva do banco de dados.`,
        )
    }

    if (usaData && usaId && chuvaExistente.id !== body.id) {
      throw createHTTPException(
        400,
        `Chuva com data ${body.data} não corresponde ao id ${body.id}.`,
        `Data ${body.data} e id ${body.id} em linhas diferentes da tabela chuva do banco de dados.`,
      )
    }

    const medicoes = await db
      .select()
      .from(schema.medicao)
      .where(eq(schema.medicao.idChuva, chuvaExistente.id))
      .catch((c) => handleDBError(c, 'Erro ao buscar medições no banco de dados.'))

    const mExistentesIdPluvi = medicoes.map((m) => m.idPluvi)

    const bodyMedicoesIdPluvi = body.medicoes.map((m) => m.idPluvi)

    // Verifica se não removeram nenhum pluviômetro
    const pluviometrosRemovidos = mExistentesIdPluvi.filter(
      (id) => !bodyMedicoesIdPluvi.includes(id),
    )

    // Verifica se não adicionaram nenhum pluviômetro
    const pluviometrosAdicionados = bodyMedicoesIdPluvi.filter(
      (id) => !mExistentesIdPluvi.includes(id),
    )

    if (pluviometrosRemovidos.length || pluviometrosAdicionados.length) {
      throw createHTTPException(
        400,
        {
          message: 'Não é permitido alterar quais pluviômetros registraram essa chuva.',
          removidos: pluviometrosRemovidos,
          adicionados: pluviometrosAdicionados,
        },
        'Array de pluviômetros do pedido não equivale aos pluviômetros originais',
      )
    }

    const pluvis = await db
      .select()
      .from(schema.pluviometro)
      .where(inArray(schema.pluviometro.id, bodyMedicoesIdPluvi))
      .catch((c) => handleDBError(c, 'Erro ao selecionar pluviometros no banco de dados.'))

    const errors: object[] = []
    const dadosNovos: { quantidadeMm: number, quantidadeLitros: number}[] = []

    for (const [i, medicao] of body.medicoes.entries()) {
      const pluvi = pluvis.find((p) => p.id === medicao.idPluvi)!

      if (pluvi.tipo == 'automatico') {
        if ('quantidadeLitros' in medicao) {
          errors.push(
            await createHTTPException(
              400,
              'Deve-se inserir apenas os milímetros calculados pelo pluviômetro automático.',
            )
              .getResponse()
              .json(),
          )
        } else if (medicao.quantidadeMm > (pluvi.capacidadeLitros / pluvi.areaCaptacaoM2)) {
          errors.push(
            await createHTTPException(
              400,
              `Medição de índice ${i} é maior que a capacidade do pluviômetro.`,
            )
              .getResponse()
              .json(),
          )
        }
      }

      if (pluvi.tipo == 'manual') {
        if ('quantidadeMm' in medicao) {
          errors.push(
            await createHTTPException(
              400,
              'Deve-se inserir apenas os litros armazenados pelo pluviômetro manual.',
            )
              .getResponse()
              .json(),
          )
        } else if (medicao.quantidadeLitros > pluvi.capacidadeLitros) {
          errors.push(
            await createHTTPException(
              400,
              `Medição de índice ${i} é maior que a capacidade do pluviômetro.`,
            )
              .getResponse()
              .json(),
          )
        }
      }

      dadosNovos.push('quantidadeLitros' in medicao
        ? {
          quantidadeLitros: medicao.quantidadeLitros,
          quantidadeMm: medicao.quantidadeLitros / pluvi.areaCaptacaoM2
        } : {
          quantidadeLitros: medicao.quantidadeMm * pluvi.areaCaptacaoM2,
          quantidadeMm: medicao.quantidadeMm
        }
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
        eq(schema.medicao.idPluvi, idPluvi),
      )

    const medicoesAtualizadas = await db.transaction(async (tx) => {
      const updates = []

      for (const [i, m] of body.medicoes.entries()) {
        const [medicaoAtualizada] = await tx
          .update(schema.medicao)
          .set(dadosNovos[i])
          .where(compareMedicao(m.idPluvi, chuvaExistente.id))
          .returning()
          .catch((c) => handleDBError(c, 'Erro ao atualizar medição no banco de dados.'))

        updates.push(medicaoAtualizada)
      }

      return updates
    })

    let media: number = 0
    medicoesAtualizadas.forEach((m) => media += m.quantidadeMm)
    media = Math.round(((media / medicoesAtualizadas.length) + Number.EPSILON) * 100) / 100
    if (Number.isNaN(media)) media = 0

    return c.json(
      {
        message: 'Medições atualizadas com sucesso.',
        chuva: { ...chuvaExistente, media, medicoes: medicoesAtualizadas },
      },
      200,
    )
  },
)
