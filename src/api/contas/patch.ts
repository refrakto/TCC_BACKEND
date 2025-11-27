import { Hono } from 'hono'
import { vValidator } from '@hono/valibot-validator'
import { CadastroPartialSchema, EmailSchema } from '../../valibot/cadastro.ts'
import * as schema from 'schema'
import { eq, inArray } from 'drizzle-orm'
import { hash } from '@felix/argon2'
import { array, flatten, InferInput, minLength, object, pipe } from 'valibot'
import { acesso } from '../../utils/permissao.ts'
import { createHTTPException, handleDBError } from '../../utils/errors.ts'
import dayjs from 'dayjs'

export const SelectCadastroArraySchema = pipe(
  array(
    object({
      selecao: EmailSchema,
      edicao: CadastroPartialSchema,
    }),
    'Array de cadastros inválido',
  ),
  minLength(1, 'Array de cadastros vazio'),
)

export type CadastroRequest = InferInput<typeof SelectCadastroArraySchema>

export default new Hono().patch(
  '/',
  acesso('admin'),
  vValidator('json', SelectCadastroArraySchema, (r, c) => {
    if (!r.success) {
      return c.json(
        { message: 'Erro de Validação', errors: flatten(r.issues) },
        422,
      )
    }
  }),
  async (c) => {
    const body = c.req.valid('json')
    const db = c.get('db')

    const emailsSelecionados = body.map((v) => v.selecao.trim().toLowerCase())
    const emailCounts = new Map<string, number>()
    for (const e of emailsSelecionados) emailCounts.set(e, (emailCounts.get(e) || 0) + 1)

    const duplicatedInput = Array.from(emailCounts.entries())
      .filter(([, c]) => c > 1)
      .map(([e]) => e)

    if (duplicatedInput.length) {
      throw createHTTPException(400, `Emails duplicados no request: ${duplicatedInput.join(', ')}`)
    }

    const existentes = await db
      .select()
      .from(schema.usuario)
      .where(inArray(schema.usuario.email, emailsSelecionados))
      .catch((c) => handleDBError(c, 'Erro ao buscar usuários no banco de dados.'))

    if (!existentes.length) {
      throw createHTTPException(
        404,
        `Nenhum usuário encontrado.`,
      )
    }

    if (existentes.length !== emailsSelecionados.length) {
      const falhas = emailsSelecionados.filter((e) => !(existentes.some((u) => u.email === e)))
      throw createHTTPException(
        404,
        `Usuários com os emails: ${falhas.join(', ')} não encontrados.`,
      )
    }

    const toUpdate: CadastroRequest = []

    const errors = await Promise.allSettled(
      body.map(async (i) => {
        const existente = existentes.find((u) => u.email === i.selecao)!
        const Estagiario = (i.edicao.permissao === 'estagiario') ||
          (i.edicao.permissao === undefined && existente.permissao === 'estagiario')

        if (Estagiario) {
          if ('dataInicio' in i.edicao && i.edicao.dataInicio !== undefined) {
            if (
              'dataFim' !== undefined && dayjs(i.edicao.dataInicio).isAfter(dayjs(i.edicao.dataFim))
            ) {
              return i.selecao
            }

            if (dayjs(i.edicao.dataInicio).isAfter(dayjs(existente.dataFim))) {
              return i.selecao
            }
          }

          if (
            'dataFim' in i.edicao && i.edicao.dataFim !== undefined &&
            dayjs(i.edicao.dataFim).isBefore(dayjs(existente.dataInicio))
          ) {
            return i.selecao
          }

          const senha = i.edicao.senha !== undefined ? await hash(i.edicao.senha) : undefined

          toUpdate.push({
            edicao: {
              email: i.edicao.email,
              nome: i.edicao.nome,
              permissao: i.edicao.permissao,
              dataInicio: 'dataInicio' in i.edicao ? i.edicao.dataInicio : undefined,
              dataFim: 'dataFim' in i.edicao ? i.edicao.dataFim : undefined,
              senha,
            },
            selecao: i.selecao,
          })
        }

        const senha = i.edicao.senha !== undefined ? await hash(i.edicao.senha) : undefined

        toUpdate.push({
          edicao: {
            email: i.edicao.email,
            nome: i.edicao.nome,
            permissao: i.edicao.permissao,
            senha,
          },
          selecao: i.selecao,
        })
      }),
    )

    if (errors.length) {
      throw createHTTPException(
        400,
        { message: 'Data de início não pode ser maior que a data de fim.', selecoes: errors },
      )
    }

    const updated = await db.transaction(async (tx) => {
      const result = []

      for (const usuario of toUpdate) {
        const instance = await tx
          .update(schema.usuario)
          .set(usuario.edicao)
          .where(eq(schema.usuario.email, usuario.selecao))
          .returning()
          .catch((c) => handleDBError(c, 'Erro ao inserir usuários no banco de dados.'))

        if (!result.length) {
          throw createHTTPException(500, 'Erro ao inserir usuários no banco de dados.')
        }

        result.push(instance[0])
      }

      return result
    })

    return c.json({
      message: 'Usuários atualizados com sucesso.',
      usuarios: updated.map((usuario) =>
        usuario.permissao === 'admin'
          ? {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            permissao: 'admin',
          }
          : {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            permissao: 'estagiario',
            dataInicio: usuario.dataInicio,
            dataFim: usuario.dataFim,
          }
      ),
    }, 200)
  },
)
