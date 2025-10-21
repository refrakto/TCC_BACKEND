import { date, pgTable, serial } from 'drizzle-orm/pg-core'

export const chuva = pgTable('chuva', {
  id: serial().primaryKey().unique(),
  data: date({ mode: 'string' }).notNull(),
})

export type Chuva = typeof chuva.$inferSelect
export type NewChuva = typeof chuva.$inferInsert
