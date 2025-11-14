import { array, check, literal, object, optional, pipe, union } from 'valibot'
import { DataSchema, IDSchema, MedidaMmSchema } from './comum.ts'

export const AutoSchema = object({
  idPluvi: IDSchema('o pluviômetro'),
  tipoPluvi: literal('automatico'),
  quantidadeMm: MedidaMmSchema('medição em milímetros', 3),
})

export const ManualSchema = object({
  idPluvi: IDSchema('o pluviômetro'),
  tipoPluvi: literal('manual'),
  quantidadeLitros: MedidaMmSchema('medição em litros', 2),
})

export const MedicaoSchema = union([AutoSchema, ManualSchema])

export const ArrayMedicoesSchema = pipe(
  array(MedicaoSchema),
  check((v) => {
    const ids = v.map((m) => m.idPluvi)
    return ids.length === new Set(ids).size
  }, 'Não pode haver medições duplicadas para o mesmo pluviômetro.'),
)

export const ChuvaSchema = pipe(
  object({ data: DataSchema, medicoes: ArrayMedicoesSchema }),
)

export const SelectChuvaSchema = union([
  object({ id: optional(IDSchema('a chuva')), data: DataSchema }),
  object({ id: IDSchema('a chuva'), data: optional(DataSchema) }),
])