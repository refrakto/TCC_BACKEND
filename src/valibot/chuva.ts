import { array, check, object, optional, pipe, union } from 'valibot'
import { DataSchema, IDSchema, MedidaMmSchema } from './comum.ts'

export const MedicaoSchema = object({
  idPluvi: IDSchema('o pluviômetro'),
  quantidadeMm: MedidaMmSchema('medição'),
})

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