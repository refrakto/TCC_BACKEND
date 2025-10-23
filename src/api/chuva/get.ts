import { vValidator } from '@hono/valibot-validator'
import { Hono } from 'hono'
import { check, forward, object, pipe, union } from 'valibot'
import { DataSchema } from 'valibot/comum'
import * as schema from 'database'
import { and, eq, gte, lte } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { BunSQLDatabase } from 'drizzle-orm/bun-sql'
import { ContentfulStatusCode } from 'hono/utils/http-status'

const getRequestSchema = union(
  [
    object({ data: DataSchema }),
    pipe(
      object({ dataPrimeira: DataSchema, dataUltima: DataSchema }),
      forward(
        check(
          g => new Date(g.dataPrimeira) > new Date(g.dataUltima),
          'Data da primeira Chuva a selecionar é maior que data da última Chuva a selecionar.'
        ),
        ['dataUltima']
      )
    ),
  ],
  'Campos inválidos. Deve-se ter "data" para selecionar uma chuva ou "dataPrimeira e dataUltima para selecionar várias.'
)

export default new Hono().get(
  '/',
  vValidator('json', getRequestSchema),
  async c => {
    const db = c.get('db')
    const body = c.req.valid('json')

    if ('data' in body) {
      const chuva = (
        await db
          .select()
          .from(schema.chuva)
          .where(eq(schema.chuva.data, body.data))
          .catch(cause => {
            throw new HTTPException(500, {
              message: 'Erro ao selecionar chuva no banco de dados.',
              cause,
            })
          })
      )[0]

      if (!chuva) return c.json({ error: 'Chuva não encontrada.' }, 401)

      const retorno = await getChuva(chuva, db)

      if ('message' in retorno) {
        return c.json({ error: retorno.message }, retorno.status)
      }

      return c.json({ chuva: retorno }, 200)
    }

    const chuvas = await db
      .select()
      .from(schema.chuva)
      .where(
        and(
          gte(schema.chuva.data, body.dataPrimeira),
          lte(schema.chuva.data, body.dataUltima)
        )
      )
      .catch(cause => {
        throw new HTTPException(500, {
          message: 'Erro ao selecionar chuvas no banco de dados.',
          cause,
        })
      })

    if (!chuvas.length) return c.json({ error: 'Chuvas não encontradas.' }, 401)

    const sucessos: (schema.Chuva & { media: number; medicoes: schema.Medicao[] })[] = []
    const errors: (schema.Chuva & { message: string; status: ContentfulStatusCode })[] = []
    for(const chuva of chuvas) {
      const tentativa = await getChuva(chuva, db)
      if('message' in tentativa) {
        errors.push(tentativa)
        continue
      }

      sucessos.push(tentativa)
    }
    
    if (!sucessos.length) return c.json({ error: 'Nenhuma medição encontrada.' }, 401)

    if (errors.length) return c.json({ chuvas: { sucessos }, errors: errors }, 207)

    return c.json({ chuvas: { sucessos } }, 200)
  }
)

async function getChuva(
  chuva: schema.Chuva,
  db: BunSQLDatabase<typeof schema> & { $client: Bun.SQL }
): Promise<
  | (schema.Chuva & { media: number; medicoes: schema.Medicao[] })
  | (schema.Chuva & { message: string; status: ContentfulStatusCode })
> {
  const medicoes = await db
    .select()
    .from(schema.medicao)
    .where(eq(schema.medicao.idChuva, chuva.id))
    .catch(cause => {
      throw new HTTPException(500, {
        message: 'Erro ao selecionar Medições no banco de dados.',
        cause,
      })
    })

  if (!medicoes.length)
    return { id: chuva.id, data: chuva.data, message: 'Medições não encontradas.', status: 401 }

  let media: number = 0

  for (const medicao of medicoes) {
    media += medicao.quantidadeMm
  }
  media = Math.round((media + Number.EPSILON) * 100) / 100

  return { id: chuva.id, data: chuva.data, media, medicoes }
}
