import { Hono } from 'hono'
import * as schema from '@/database/main.ts'
import { handleDBError } from '../../utils/errors.ts'

export default new Hono().get('/', async (c) => {
  const db = c.get('db')

  const pluvis = await db.select().from(schema.pluviometro).catch((c) =>
    handleDBError(c, 'Erro ao buscar pluviômetros no banco de dados.')
  )

  return c.json({
    message: 'Pluviômetros selecionados com sucesso.',
    pluvis,
  }, 200)
})
