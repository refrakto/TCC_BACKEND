import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from 'database'
import { JWTPayload } from 'jose'

declare module 'hono' {
  interface ContextVariableMap {
    db: ReturnType<typeof drizzle<typeof schema>>
    acesso: JWTPayload
  }
}
