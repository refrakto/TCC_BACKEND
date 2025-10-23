import {
  array,
  check,
  email,
  forward,
  InferInput,
  intersect,
  isoDate,
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
import { DataSchema } from './comum'

export const NomeSchema = pipe(
  string(),
  trim(),
  maxLength(100, 'O nome deve ter no máximo 100 caracteres.'),
  regex(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, 'Nome inválido.')
)

export const EmailSchema = pipe(
  string(),
  trim(),
  email('Email Inválido.'),
  maxLength(100, 'O email deve ter no máximo 100 caracteres.')
)

export const SenhaSchema = pipe(
  string(),
  trim(),
  minLength(8, 'Senha muito curta.'),
  maxLength(100, 'A senha deve ter no máximo 100 caracteres.')
)

export const PermissaoSchema = union(
  [
    object({ permissao: literal('admin', 'Permissão inválida.') }),
    pipe(
      object({
        permissao: literal('estagiario', 'Permissão inválida.'),
        dataInicio: DataSchema,
        dataFim: optional(DataSchema),
      }),
      forward(
        check(i => !i.dataFim || new Date(i.dataInicio) < new Date(i.dataFim)),
        ['dataFim']
      )
    ),
  ],
  'Data de fim de Estágio maior que Data de início de Estágio.'
)

export const CadastroBaseSchema = object({
  nome: NomeSchema,
  email: EmailSchema,
  senha: SenhaSchema,
})

export const CadastroSchema = intersect([CadastroBaseSchema, PermissaoSchema])
