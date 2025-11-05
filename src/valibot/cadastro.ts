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

export const PermissaoSchema = union(
  [
    object({ permissao: literal('admin', 'Permissão inválida.') }),
    pipe(
      object({
        permissao: literal('estagiario', 'Permissão inválida.'),
        dataInicio: DataLivreSchema,
        dataFim: optional(DataLivreSchema),
      }),
      forward(
        check((i) => !i.dataFim || dayjs(i.dataFim).isAfter(i.dataInicio)),
        ['dataFim'],
      ),
    ),
  ],
  'Data de fim de Estágio igual ou maior que Data de início de Estágio.',
)

export const CadastroBaseSchema = object({
  nome: pipe(NomeSchema, regex(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, 'Nome inválido.')),
  email: EmailSchema,
  senha: SenhaSchema,
})

export const CadastroSchema = intersect([CadastroBaseSchema, PermissaoSchema])

export const SelectCadastroSchema = union([
  object({ id: optional(IDSchema('o usuário')), email: EmailSchema }),
  object({ id: IDSchema('o usuário'), email: optional(EmailSchema) }),
])
