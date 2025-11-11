import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import * as schema from '@/database/main.ts'
import { acesso, jsonValidator } from '@/utils/permissao.ts'
import { createHTTPException, handleDBError } from '@/utils/errors.ts'
import { SelectChuvaSchema } from '@/valibot/chuva.ts'

export default new Hono().delete(
  '/',
  acesso('estagiario'),
  jsonValidator(SelectChuvaSchema),
  async (c) => {
    const db = c.get('db')
    const body = c.req.valid('json')

    const usaData = body.data ? true : false
    const usaId = body.id ? true : false
    
    const compare = usaData ? eq(schema.chuva.data, body.data!) : eq(schema.chuva.id, body.id!)

    const [chuva] = await db
      .select()
      .from(schema.chuva)
      .where(compare)
      .catch((c) => handleDBError(c, 'Erro ao buscar chuva no banco de dados.'))
    
    if (!chuva) {
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
    
    if (usaData && usaId && chuva.id !== body.id)
      throw createHTTPException(
        400,
        `Chuva com data ${body.data} não corresponde ao id ${body.id}.`,
        `Data ${body.data} e id ${body.id} em linhas diferentes da tabela chuva do banco de dados.`,
      )

    const medicoes = await db
      .select()
      .from(schema.medicao)
      .where(eq(schema.medicao.idChuva, chuva.id))
      .catch((c) => handleDBError(c, 'Erro ao buscar medições no banco de dados.'))

    const [chuvaDeletada] = await db
      .delete(schema.chuva)
      .where(eq(schema.chuva.id, chuva.id))
      .returning()
      .catch((c) => handleDBError(c, 'Erro ao deletar chuva no banco de dados.'))

    let media: number = 0
    medicoes.forEach((m) => media += m.quantidadeMm)
    media = Math.round((media + Number.EPSILON) * 100) / 100

    const deletado = {
      ...chuvaDeletada,
      medicoes,
      media,
    }

    return c.json(
      {
        message: 'Chuva e medições deletadas com sucesso.',
        chuva: deletado,
      },
      200,
    )
  },
)
