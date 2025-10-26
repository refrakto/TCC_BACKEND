import { HTTPException } from 'hono/http-exception'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { JOSEError, JWTExpired } from 'jose/errors'

export function createHTTPException(
  status: ContentfulStatusCode,
  body: { message: string } & Record<string, any> | string,
  cause?: unknown
) {
  const finalBody = typeof body === 'string' ? { message: body } : body;
  return new HTTPException(status, {
    message: finalBody.message,
    cause,
    res: new Response(JSON.stringify(finalBody), {
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    }),
  })
}

export const handleJWTError = (cause: JOSEError) => {
  if (cause instanceof JWTExpired)
    throw createHTTPException(401, 'Autenticação Expirada', cause.code)

  throw createHTTPException(401, 'Autenticação Inválida', cause.code)
}

export const handleDBError = (cause: any, message: string) => {
  throw createHTTPException(500, message, cause)
}
