import { decimal, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core'
import { pluviometro } from './pluviometro'
import { chuva } from './chuva'

export const medicao = pgTable(
  'medicao',
  {
    idPluvi: integer()
      .notNull()
      .references(() => pluviometro.id, { onDelete: 'restrict' }),
    idChuva: integer()
      .notNull()
      .references(() => chuva.id, { onDelete: 'cascade' }),
    quantidadeMm: decimal({ precision: 5, scale: 2, mode: 'number' }).notNull(),
  },
  table => [primaryKey({ columns: [table.idPluvi, table.idChuva] })]
)

export type Medicao = typeof medicao.$inferSelect
export type NewMedicao = typeof medicao.$inferInsert
