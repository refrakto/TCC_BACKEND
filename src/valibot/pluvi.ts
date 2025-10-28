import { boolean, check, maxValue, minValue, number, object, optional, pipe } from 'valibot'
import { DataSchema, hasScale, MedidaMmSchema } from './comum.ts'

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

export const PluviometroSchema = object({
  capacidadeMm: MedidaMmSchema('capacidade'),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  arquivado: optional(boolean('O valor de arquivado deve ser booleano.'), false),
  dataAquisicao: optional(DataSchema),
})
