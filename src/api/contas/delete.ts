import { Hono } from 'hono'
import { acesso, jsonValidator } from '../../utils/permissao.ts'
import { SelectCadastroSchema } from '../../valibot/cadastro.ts'
import * as schema from '@/database/main.ts'
import { eq } from 'drizzle-orm'
import { createHTTPException, handleDBError } from '../../utils/errors.ts'

export default new Hono().delete(
  '/',
  acesso('admin'),
  jsonValidator(SelectCadastroSchema),
  async (c) => {
    const db = c.get('db')
    const body = c.req.valid('json')
    const acesso = c.get('acesso')

    const usaEmail = body.email ? true : false
    const usaId = body.id ? true : false

    const compare = usaEmail
      ? eq(schema.usuario.email, body.email!)
      : eq(schema.usuario.id, body.id!)

    const [usuario] = await db
      .select()
      .from(schema.usuario)
      .where(compare)
      .catch((c) => handleDBError(c, 'Erro ao buscar usuário no banco de dados.'))

    if (!usuario) {
      throw usaEmail
        ? createHTTPException(
          404,
          `Usuário com email ${body.email} não encontrado.`,
          `Email ${body.email} não identificado na tabela usuário do banco de dados.`,
        )
        : createHTTPException(
          404,
          `Usuário com id ${body.id} não encontrado.`,
          `Id ${body.id} não identificado na tabela usuário do banco de dados.`,
        )
    }

    if (acesso.id === usuario.id) {
      throw createHTTPException(
        400,
        'Não é possível deletar a própria conta.',
      )
    }

    if (usaEmail && usaId) {
      if (usuario.id !== body.id) {
        throw createHTTPException(
          400,
          `Usuário com email ${body.email} não corresponde ao id ${body.id}.`,
          `Email ${body.email} e id ${body.id} em linhas diferentes da tabela usuário do banco de dados.`,
        )
      }
    }

    const usuarioDeletado = await db.transaction(async (tx) => {
      const result = await tx
        .delete(schema.usuario)
        .where(compare)
        .returning()
        .catch((c) => handleDBError(c, 'Erro ao excluir usuário no banco de dados.'))

      if (!result.length) {
        throw createHTTPException(500, 'Erro ao excluir usuário no banco de dados.')
      }

      return result[0]
    })

    return c.json(
      usuarioDeletado.permissao === 'admin'
        ? {
          id: usuarioDeletado.id,
          email: usuarioDeletado.email,
          nome: usuarioDeletado.nome,
          permissao: 'admin',
        }
        : {
          id: usuarioDeletado.id,
          email: usuarioDeletado.email,
          nome: usuarioDeletado.nome,
          permissao: 'estagiario',
          dataInicio: usuarioDeletado.dataInicio ?? undefined,
          dataFim: usuarioDeletado.dataFim ?? undefined,
        },
    )
  },
)
