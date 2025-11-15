import {
  check,
  email,
  forward,
  intersect,
  literal,
  maxLength,
  minLength,
  object,
  optional,
  partial,
  pipe,
  regex,
  string,
  trim,
  union,
} from 'valibot'
import { DataLivreSchema, IDSchema, NomeSchema } from './comum.ts'
import dayjs from 'dayjs'

export const EmailSchema = pipe(
  string('Email deve ser uma string.'),
  trim(),
  email('Email Inválido.'),
  maxLength(100, 'O email deve ter no máximo 100 caracteres.'),
)

export const SenhaSchema = pipe(
  string(),
  trim(),
  minLength(8, 'Senha muito curta.'),
  maxLength(100, 'A senha deve ter no máximo 100 caracteres.'),
)

export const AdminSchema = object({ permissao: literal('admin', 'Permissão inválida.') })
export const EstagiarioSchema = object({
  permissao: literal('estagiario', 'Permissão inválida.'),
  dataInicio: DataLivreSchema,
  dataFim: optional(DataLivreSchema),
})

export const PermissaoSchema = union(
  [
    AdminSchema,
    pipe(
      EstagiarioSchema,
      forward(
        check(
          (i) => !i.dataFim || dayjs(i.dataFim).isAfter(i.dataInicio),
          'Data de fim de Estágio igual ou maior que Data de início de Estágio.',
        ),
        ['dataFim'],
      ),
    ),
  ],
)

export const CadastroBaseSchema = object({
  nome: pipe(NomeSchema, regex(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, 'Nome inválido.')),
  email: EmailSchema,
  senha: SenhaSchema,
})

export const CadastroSchema = intersect([CadastroBaseSchema, PermissaoSchema])

export const CadastroPartialSchema = intersect([
  partial(CadastroBaseSchema),
  union([
    partial(AdminSchema),
    pipe(
      partial(EstagiarioSchema),
      forward(
        check(
          (i) => !i.dataFim || !i.dataInicio || dayjs(i.dataFim).isAfter(i.dataInicio),
          'Data de fim de Estágio igual ou maior que Data de início de Estágio.',
        ),
        ['dataFim'],
      ),
    ),
  ]),
])

export const SelectCadastroSchema = union([
  object({ id: optional(IDSchema('o usuário')), email: EmailSchema }),
  object({ id: IDSchema('o usuário'), email: optional(EmailSchema) }),
])
