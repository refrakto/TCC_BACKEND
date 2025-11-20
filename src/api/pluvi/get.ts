import { Hono } from 'hono'
import * as schema from 'schema'
import { createHTTPException, handleDBError } from '../../utils/errors.ts'

export default new Hono().get('/', async (c) => {
  const db = c.get('db')

  const pluvis = await db.select().from(schema.pluviometro).catch((c) =>
    handleDBError(c, 'Erro ao buscar pluviômetros no banco de dados.')
  )

  if (!pluvis.length) {
    throw createHTTPException(
      404,
      'Pluviômetros não encontrados.',
      'Array pluvis contém 0 elementos.',
    )
  }
  
  return c.json({
    message: 'Pluviômetros enviados com sucesso.',
    pluvis,
  }, 200)
})
