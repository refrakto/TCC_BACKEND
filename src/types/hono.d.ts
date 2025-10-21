import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from 'database'

declare module 'hono' {
  interface ContextVariableMap {
    db: ReturnType<typeof drizzle<typeof schema>>
  }
}
