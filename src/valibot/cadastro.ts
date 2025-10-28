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
import { DataLivreSchema } from './comum.ts'
import dayjs from 'dayjs'

export const NomeSchema = pipe(
  string(),
  trim(),
  maxLength(100, 'O nome deve ter no máximo 100 caracteres.'),
  regex(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, 'Nome inválido.'),
)

export const EmailSchema = pipe(
  string(),
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
  nome: NomeSchema,
  email: EmailSchema,
  senha: SenhaSchema,
})

export const CadastroSchema = intersect([CadastroBaseSchema, PermissaoSchema])
