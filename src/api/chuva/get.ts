import { Hono } from 'hono'
import { check, forward, object, pipe, union } from 'valibot'
import { DataSchema } from '@/valibot/comum.ts'
import * as schema from '@/database/main.ts'
import { and, eq, gte, lte } from 'drizzle-orm'
import { jsonValidator } from '@/utils/permissao.ts'
import { createHTTPException, handleDBError } from '@/utils/errors.ts'
import { HTTPException } from 'hono/http-exception'
import dayjs from 'dayjs'
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver'
import { Pool } from 'pg'

const getRequestSchema = union(
  [
    object({ data: DataSchema }),
    pipe(
      object({ dataPrimeira: DataSchema, dataUltima: DataSchema }),
      forward(
        check(
          (g) => dayjs(g.dataUltima).isAfter(g.dataPrimeira, 'day'),
          'Data da primeira Chuva a selecionar é maior que data da última Chuva a selecionar.',
        ),
        ['dataUltima'],
      ),
    ),
  ],
  'Campos inválidos. Deve-se ter "data" para selecionar uma chuva ou "dataPrimeira e dataUltima para selecionar várias.',
)

export default new Hono().get('/', jsonValidator(getRequestSchema), async (c) => {
  const db = c.get('db')
  const body = c.req.valid('json')

  if ('data' in body) {
    const [chuva] = await db
      .select()
      .from(schema.chuva)
      .where(eq(schema.chuva.data, body.data))
      .catch((c) => handleDBError(c, 'Erro ao buscar chuva no banco de dados.'))

    if (!chuva) {
      throw createHTTPException(
        404,
        'Chuva não encontrada.',
        'chuva == undefined',
      )
    }

    const retorno = await getChuva(chuva, db)

    return c.json({
      message: 'Chuva enviada com sucesso.',
      chuva: retorno,
    }, 200)
  }

  const chuvas = await db
    .select()
    .from(schema.chuva)
    .where(
      and(
        gte(schema.chuva.data, body.dataPrimeira),
        lte(schema.chuva.data, body.dataUltima),
      ),
    )
    .catch((c) => handleDBError(c, 'Erro ao buscar chuvas no banco de dados.'))

  if (!chuvas.length) {
    throw createHTTPException(
      404,
      'Chuvas não encontradas.',
      'Array chuvas contém 0 elementos.',
    )
  }

  const sucessos: Awaited<ReturnType<typeof getChuva>>[] = []
  const errors: object[] = []

  for (const chuva of chuvas) {
    const tentativa = await getChuva(chuva, db).catch(
      async (e: HTTPException) => {
        if (e.status === 500) throw e

        errors.push(await e.getResponse().json())
      },
    )
    if (!tentativa) continue

    sucessos.push(tentativa)
  }

  if (!sucessos.length) {
    throw createHTTPException(
      404,
      'Nenhuma medição encontrada.',
      'Array sucessos contém 0 elementos.',
    )
  }

  if (errors.length) {
    return c.json({
      message: 'Sucesso parcial ao enviar chuvas.',
      chuvas: { sucessos },
      errors,
    }, 207)
  }

  return c.json({
    message: 'Chuvas enviadas com sucesso.',
    chuvas: { sucessos },
  }, 200)
})

async function getChuva(
  chuva: schema.Chuva,
  db: NodePgDatabase<typeof schema> & { $client: Pool },
): Promise<schema.Chuva & { media: number; medicoes: schema.Medicao[] }> {
  const medicoes = await db
    .select()
    .from(schema.medicao)
    .where(eq(schema.medicao.idChuva, chuva.id))
    .catch((c) => handleDBError(c, 'Erro ao buscar medições no banco de dados.'))

  if (!medicoes.length) {
    throw createHTTPException(404, {
      message: 'Medições não encontradas.',
      id: chuva.id,
      data: chuva.data,
    })
  }

  let media: number = 0
  medicoes.forEach((m) => media += m.quantidadeMm)
  media = Math.round((media + Number.EPSILON) * 100) / 100

  return { id: chuva.id, data: chuva.data, media, medicoes }
}
