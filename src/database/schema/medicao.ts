import { check, decimal, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core'
import { pluviometro } from './pluviometro.ts'
import { chuva } from './chuva.ts'
import { sql } from 'drizzle-orm'

export const medicao = pgTable(
  'medicao',
  {
    idPluvi: integer()
      .notNull()
      .references(() => pluviometro.id, { onDelete: 'restrict' }),
    idChuva: integer()
      .notNull()
      .references(() => chuva.id, { onDelete: 'cascade' }),
    quantidadeMm: decimal({ precision: 5, scale: 3, mode: 'number' }).notNull(),
    quantidadeLitros: decimal({ precision: 5, scale: 2, mode: 'number' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.idPluvi, table.idChuva] }),
    check('Litros_limite', sql`(SELECT capacidadeLitros FROM pluviometro WHERE id = ${table.idPluvi}) >= ${table.quantidadeLitros}`)
  ],
)

export type Medicao = typeof medicao.$inferSelect
export type NewMedicao = typeof medicao.$inferInsert
