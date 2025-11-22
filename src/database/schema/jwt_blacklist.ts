import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const jwt_blacklist = pgTable('jwt_blacklist', {
  jti: text('jti').primaryKey(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

export type JwtBlacklist = typeof jwt_blacklist.$inferSelect
export type NewJwtBlacklist = typeof jwt_blacklist.$inferInsert