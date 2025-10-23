import { vValidator } from '@hono/valibot-validator'
import { Hono } from 'hono'
import { acesso } from 'utils/permissao'
import { ChuvaSchema } from 'valibot/chuva'
import * as schema from 'database'
import { eq, inArray } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'

export default new Hono().post(
  '/',
  acesso('estagiario'),
  vValidator('json', ChuvaSchema),
  async c => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const existente = await db
      .select()
      .from(schema.chuva)
      .where(eq(schema.chuva.data, body.data))

    if (existente.length)
      return c.json(
        { error: `Chuva já registrada na data ${existente[0].data}.` },
        400
      )

    const MedicoesID = body.medicoes.map(m => m.idPluvi)

    const listaPluvis = await db
      .select()
      .from(schema.pluviometro)
      .where(inArray(schema.pluviometro.id, MedicoesID))

    if (listaPluvis.length < MedicoesID.length)
      return c.json(
        { error: 'Medição selecionou pluviômetro inexistente.' },
        400
      )

    let errors: object[] = []

    for (const [i, medicao] of body.medicoes.entries()) {
      const pluvi = listaPluvis.find(p => p.id === medicao.idPluvi)

      if (!pluvi) {
        errors.push({
          message: `Medição de índice ${i} seleciona pluviômetro inexistente.`,
        })
        continue
      }

      if (pluvi.arquivado) {
        errors.push({
          message: `Medição de índice ${i} seleciona pluviômetro arquivado.`,
        })
        continue
      }

      if (medicao.quantidadeMm > pluvi.capacidadeMm) {
        errors.push({
          message: `Medição de índice ${i} tem medida maior que capacidade de pluviômetro.`,
        })
      }
    }

    if (errors.length) return c.json({ errors: errors }, 400)

    const chuva = await db
      .insert(schema.chuva)
      .values({ data: body.data })
      .returning()
      .catch(cause => {
        throw new HTTPException(500, {
          message: 'Erro ao inserir Chuva no banco de dados.',
          cause,
        })
      })

    let insert: ((typeof body.medicoes)[0] & { idChuva: number })[] = []

    for (const [i] of body.medicoes.entries()) {
      insert[i] = {
        idPluvi: body.medicoes[i].idPluvi,
        quantidadeMm: body.medicoes[i].quantidadeMm,
        idChuva: chuva[0].id,
      }
    }

    db.insert(schema.medicao)
      .values(insert)
      .catch(cause => {
        throw new HTTPException(500, {
          message: 'Erro ao inserir Medição no banco de dados.',
          cause,
        })
      })
  }
)
