import { boolean, decimal, pgEnum, pgTable, serial, varchar } from 'drizzle-orm/pg-core'

export const TipoPluviEnum = pgEnum('TipoPluviometro', ['manual', 'automatico'])

export const pluviometro = pgTable('pluviometro', {
  id: serial().primaryKey().unique(),
  nome: varchar({ length: 100 }).notNull(),
  tipo: TipoPluviEnum().notNull(),
  capacidadeLitros: decimal({ precision: 5, scale: 2, mode: 'number' }).notNull(),
  areaCaptacaoM2: decimal({ precision: 6, scale: 4, mode: 'number' }).notNull(),
  latitude: decimal({ precision: 8, scale: 6, mode: 'number' }),
  longitude: decimal({ precision: 9, scale: 6, mode: 'number' }),
  altitude: decimal({ precision: 8, scale: 2, mode: 'number' }),
  arquivado: boolean().notNull().default(false),
})

export type Pluviometro = typeof pluviometro.$inferSelect
export type NewPluviometro = typeof pluviometro.$inferInsert
