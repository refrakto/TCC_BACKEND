import { Hono } from 'hono'
import { vValidator } from '@hono/valibot-validator'
import { CadastroSchema } from 'utils/valibot'
import * as schema from 'database'
import { HTTPException } from 'hono/http-exception'
import { inArray } from 'drizzle-orm'
import { hash } from '@node-rs/argon2'
import { array, InferInput, minLength, pipe } from 'valibot'

export const CadastroArraySchema = pipe(
  array(CadastroSchema, 'Array de cadastros inválido'),
  minLength(1, 'Array de cadastros vazio')
)

export type CadastroRequest = InferInput<typeof CadastroArraySchema>

export default new Hono().post(
  '/',
  vValidator('json', CadastroArraySchema, r => {
    if (!r.success) {
      const formattedIssues = r.issues.map(i => ({
        field: i.path?.[0]?.key,
        message: i.message,
      }))
      throw new HTTPException(422, {
        message: 'Erro de Validação',
        cause: formattedIssues,
      })
    }
  }),
  async c => {
    const body = c.req.valid('json')
    const db = c.get('db')
    const emails = body.map(b => b.email.trim().toLowerCase())
    const emailCounts = new Map<string, number>()
    for (const e of emails) emailCounts.set(e, (emailCounts.get(e) || 0) + 1)

    const duplicatedInput = Array.from(emailCounts.entries())
      .filter(([, c]) => c > 1)
      .map(([e]) => e)

    if (duplicatedInput.length)
      throw new HTTPException(400, {
        message: `Emails duplicados no request: ${duplicatedInput.join(', ')}`,
      })

    const existentes = await db
      .select({ email: schema.usuario.email })
      .from(schema.usuario)
      .where(inArray(schema.usuario.email, emails))

    if (existentes.length) {
      const existentesEmails = existentes.map(r => r.email).join(', ')
      throw new HTTPException(400, {
        message: `Os seguintes emails já estão cadastrados: ${existentesEmails}`,
      })
    }

    const toInsert: CadastroRequest = []
    const responseUsuarios = []

    for (const i of body) {
      const senhaHash = await hash(i.senha)

      if (i.permissao === 'admin')
        toInsert.push({
          nome: i.nome,
          email: i.email,
          senha: senhaHash,
          permissao: 'admin',
        })
      else
        toInsert.push({
          nome: i.nome,
          email: i.email,
          senha: senhaHash,
          permissao: 'estagiario',
          dataInicio: i.dataInicio,
          dataFim: i.dataFim,
        })
    }

    const inserted = await db
      .insert(schema.usuario)
      .values(toInsert)
      .returning()

    for (const r of inserted)
      if (r.permissao === 'admin')
        responseUsuarios.push({
          id: r.id,
          nome: r.nome,
          email: r.email,
          permissao: 'admin',
        })
      else
        responseUsuarios.push({
          id: r.id,
          nome: r.nome,
          email: r.email,
          permissao: 'estagiario',
          dataInicio: r.dataInicio ?? undefined,
          dataFim: r.dataFim ?? undefined,
        })

    return c.json({ usuarios: responseUsuarios }, 201)
  }
)
