import { boolean, date, decimal, pgTable, serial } from 'drizzle-orm/pg-core'

export const pluviometro = pgTable('pluviometro', {
  id: serial().primaryKey().unique(),
  capacidadeMm: decimal({ precision: 5, scale: 2 }).notNull().default('100.00'),
  latitude: decimal({ precision: 8, scale: 6 }),
  longitude: decimal({ precision: 9, scale: 6 }),
  arquivado: boolean().notNull().default(false),
  dataAquisicao: date({ mode: 'date' }),
})

export type Pluviometro = typeof pluviometro.$inferSelect
export type NewPluviometro = typeof pluviometro.$inferInsert
