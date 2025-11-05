import { boolean, check, finite, maxValue, minValue, number, object, optional, pipe, string } from 'valibot'
import { DataSchema, hasScale, IDSchema } from './comum.ts'

export const LatitudeSchema = pipe(
  number('Latitude deve ser um número.'),
  minValue(-90, 'Latitude abaixo do mínimo de -90.'),
  maxValue(90, 'Latitude acima do máximo de 90.'),
  check((v) => hasScale(v, 6), 'Latitude deve ter no máximo 6 casas decimais.'),
)

export const LongitudeSchema = pipe(
  number('Longitude deve ser um número'),
  minValue(-180, 'Longitude abaixo do mínimo de -180.'),
  maxValue(180, 'Longitude acima do máximo de 180.'),
  check((v) => hasScale(v, 6), 'Longitude deve ter no máximo 6 casas decimais.'),
)

export const AltitudeSchema = pipe(
  number('Altitude deve ser um número.'),
  finite(`A altitude não pode ser infinita.`),
  check((v) => hasScale(v, 2), 'Altitude deve ter no máximo 2 casas decimais.'),
)

export const PluviometroSchema = object({
  nome: string('Nome deve ser uma string.'),
  capacidadeLitros: number('Capacidade deve ser um número.'),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  altitude: AltitudeSchema,
  arquivado: optional(boolean('O valor de arquivado deve ser booleano.'), false),
  dataAquisicao: optional(DataSchema),
})

export const SelectPluviSchema = object({
  id: IDSchema('o pluviômetro')
})