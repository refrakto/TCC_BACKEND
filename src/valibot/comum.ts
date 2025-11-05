import dayjs from 'dayjs'
import _isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  check,
  finite,
  integer,
  isoDate,
  looseObject,
  minValue,
  number,
  pipe,
  regex,
  string,
} from 'valibot'

export function hasScale(value: number, scale: number) {
  const decimals = value.toString().split('.')[1]?.length || 0
  return decimals <= scale
}

export const DataSchema = pipe(
  string('A data deve ser uma string.'),
  isoDate('A data deve ter formato "YYYY-MM-DD".'),
  check(
    (d) => dayjs(d).isSameOrBefore(dayjs(), 'day'),
    'Não é possível utilizar Data futura neste campo.',
  ),
)

export const DataLivreSchema = pipe(
  string('A data deve ser uma string.'),
  isoDate('A data deve ter formato "YYYY-MM-DD".'),
)

export const IDSchema = (ONome: string) =>
  pipe(
    number(`O ID d${ONome} deve ser um número.`),
    integer(`O ID d${ONome} deve ser um inteiro.`),
    minValue(1, `Não existe ID menor que 1.`),
  )

export const MedidaMmSchema = (nome: string) =>
  pipe(
    number(`A ${nome} deve ser um número.`),
    finite(`A ${nome} não pode ser infinita.`),
    minValue(0, `A ${nome} não pode ser um número negativo`),
  )

export const HeaderBearerSchema = looseObject({
  authorization: pipe(
    string('Cabeçalho Authorization obrigatório.'),
    regex(
      /^Bearer\s+[\w-]+\.[\w-]+\.[\w-]+$/,
      'Formato de Bearer Token inválido.',
    ),
  ),
})
