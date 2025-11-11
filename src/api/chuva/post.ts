import { Hono } from 'hono'
import { acesso, jsonValidator } from '@/utils/permissao.ts'
import { ChuvaSchema } from '@/valibot/chuva.ts'
import * as schema from '@/database/main.ts'
import { eq, inArray } from 'drizzle-orm'
import { createHTTPException, handleDBError } from '@/utils/errors.ts'

export default new Hono().post(
  '/',
  acesso('estagiario'),
  jsonValidator(ChuvaSchema),
  async (c) => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const existente = await db
      .select()
      .from(schema.chuva)
      .where(eq(schema.chuva.data, body.data))
      .catch((c) =>
        handleDBError(
          c,
          'Erro ao buscar chuva existente no banco de dados.',
        )
      )

    if (existente.length) {
      throw createHTTPException(
        400,
        `Chuva já registrada na data ${existente[0].data}.`,
        `Data ${existente[0].data} identificada na tabela chuva do banco de dados.`,
      )
    }

    const medicoesIdPluvi = body.medicoes.map((m) => m.idPluvi)

    const listaPluvis = await db
      .select()
      .from(schema.pluviometro)
      .where(inArray(schema.pluviometro.id, medicoesIdPluvi))
      .catch((c) => handleDBError(c, 'Erro ao buscar pluviômetros no banco de dados.'))

    const pluvisId = listaPluvis.map((p) => p.id)

    const pluvisInexistentes = medicoesIdPluvi.filter(
      (m) => !pluvisId.includes(m),
    )

    if (pluvisInexistentes.length) {
      throw createHTTPException(
        400,
        {
          message: `Não existem pluviômetros com os IDs ${pluvisInexistentes}.`,
          inexistentes: pluvisInexistentes,
        },
        'Array listaPluvis menor que array medicoesIdPluvi',
      )
    }

    const errors: object[] = []

    for (const [i, medicao] of body.medicoes.entries()) {
      const pluvi = listaPluvis.find((p) => p.id === medicao.idPluvi)!

      if (pluvi.arquivado) {
        errors.push(
          await createHTTPException(
            400,
            `Medição de índice ${i} seleciona pluviômetro arquivado.`,
          )
            .getResponse()
            .json(),
        )
        continue
      }

      if (medicao.quantidadeMm > (pluvi.capacidadeLitros / pluvi.areaCaptacaoM2)) {
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

    if (errors.length) {
      throw createHTTPException(400, {
        message: 'Medições incoerentes com pluviômetros selecionados',
        errors: errors,
      })
    }

    const retorno = await db.transaction(async (tx) => {
      const [chuva] = await tx
        .insert(schema.chuva)
        .values({ data: body.data })
        .returning()
        .catch((c) => handleDBError(c, 'Erro ao inserir chuva no banco de dados.'))

      const insert = body.medicoes.map((m) => ({
        idPluvi: m.idPluvi,
        quantidadeMm: m.quantidadeMm,
        idChuva: chuva.id,
      }))

      const medicoesInseridas = await tx
        .insert(schema.medicao)
        .values(insert)
        .returning()
        .catch((c) => handleDBError(c, 'Erro ao inserir medições no banco de dados.'))

      let media: number = 0
      medicoesInseridas.forEach((m) => media += m.quantidadeMm)
      media = Math.round((media + Number.EPSILON) * 100) / 100

      const chuvaComMedia = { ...chuva, media }

      return { ...chuvaComMedia, medicoes: medicoesInseridas }
    }).catch((e) => {
      throw e
    })

    return c.json({
      message: 'Chuva e medições inseridas com sucesso.',
      chuva: retorno,
    }, 201)
  },
)
