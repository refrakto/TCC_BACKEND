import { Hono } from 'hono'
import { acesso, jsonValidator } from 'utils/permissao'
import { ChuvaSchema } from 'valibot/chuva'
import * as schema from 'database'
import { eq, inArray } from 'drizzle-orm'
import { createHTTPException, handleDBError } from 'utils/errors'

export default new Hono().post(
  '/',
  acesso('estagiario'),
  jsonValidator(ChuvaSchema),
  async c => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const existente = await db
      .select()
      .from(schema.chuva)
      .where(eq(schema.chuva.data, body.data))
      .catch(c =>
        handleDBError(
          c,
          'Erro ao selecionar chuva existente no banco de dados.'
        )
      )

    if (existente.length)
      throw createHTTPException(
        400,
        `Chuva já registrada na data ${existente[0].data}.`,
        `Data ${existente[0].data} identificada na tabela chuva do banco de dados.`
      )

    const medicoesIdPluvi = body.medicoes.map(m => m.idPluvi)

    const listaPluvis = await db
      .select()
      .from(schema.pluviometro)
      .where(inArray(schema.pluviometro.id, medicoesIdPluvi))
      .catch(c =>
        handleDBError(c, 'Erro ao selecionar pluviometros no banco de dados.')
      )

    const pluvisId = listaPluvis.map(p => p.id)

    const pluvisInexistentes = medicoesIdPluvi.filter(
      m => !pluvisId.includes(m)
    )

    if (pluvisInexistentes.length)
      throw createHTTPException(
        400,
        {
          message: `Não existem pluviômetros com os IDs ${pluvisInexistentes}.`,
          inexistentes: pluvisInexistentes,
        },
        'Array listaPluvis menor que array medicoesIdPluvi'
      )

    const errors: object[] = []

    for (const [i, medicao] of body.medicoes.entries()) {
      const pluvi = listaPluvis.find(p => p.id === medicao.idPluvi)!

      if (pluvi.arquivado) {
        errors.push(
          await createHTTPException(
            400,
            `Medição de índice ${i} seleciona pluviômetro arquivado.`
          )
            .getResponse()
            .json()
        )
        continue
      }

      if (medicao.quantidadeMm > pluvi.capacidadeMm) {
        errors.push(
          await createHTTPException(
            400,
            `Medição de índice ${i} tem medida maior que capacidade do pluviômetro.`
          )
            .getResponse()
            .json()
        )
      }
    }

    if (errors.length)
      throw createHTTPException(400, {
        message: 'Medições incoerentes com pluviômetros selecionados',
        errors: errors,
      })

    const retorno = await db.transaction(async tx => {
      const [chuva] = await tx
        .insert(schema.chuva)
        .values({ data: body.data })
        .returning()
        .catch(c =>
          handleDBError(c, 'Erro ao inserir chuva no banco de dados.')
        )

      let insert = body.medicoes.map(m => ({
        idPluvi: m.idPluvi,
        quantidadeMm: m.quantidadeMm,
        idChuva: chuva.id,
      }))

      const medicoesInseridas = await tx
        .insert(schema.medicao)
        .values(insert)
        .returning()
        .catch(c =>
          handleDBError(c, 'Erro ao inserir medições no banco de dados.')
        )

      return { ...chuva, medicoes: medicoesInseridas }
    })

    return c.json({ chuva: retorno }, 201)
  }
)
