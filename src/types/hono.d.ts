import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from 'schema'
import { JWTPayload } from 'jose'

declare module 'hono' {
  interface ContextVariableMap {
    db: ReturnType<typeof drizzle<typeof schema>>
    acesso: JWTPayload,
    bypassJWT: boolean
  }
}
