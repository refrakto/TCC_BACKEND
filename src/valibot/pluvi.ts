import { boolean, check, finite, maxValue, minValue, number, object, optional, pipe } from 'valibot'
import { hasScale, IDSchema, MedidaMmSchema, NomeSchema } from './comum.ts'

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

export const AreaSchema = pipe(
  number('Área deve ser um número.'),
  minValue(0, 'A área não pode ser negativa.'),
  finite(`A área não pode ser infinita.`),
  check((v) => hasScale(v, 4), 'Área deve ter no máximo 4 casas decimais.'),
)

export const PluviometroSchema = object({
  nome: NomeSchema,
  capacidadeLitros: MedidaMmSchema('capacidade'),
  areaCaptacaoM2: AreaSchema,
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  altitude: AltitudeSchema,
  arquivado: optional(boolean('O valor de arquivado deve ser booleano.'), false),
})

export const SelectPluviSchema = object({
  id: IDSchema('o pluviômetro')
})