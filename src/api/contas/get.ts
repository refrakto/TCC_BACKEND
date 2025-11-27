import { Hono } from 'hono'
import * as schema from 'schema'
import { acesso } from '../../utils/permissao.ts'
import { createHTTPException, handleDBError } from '../../utils/errors.ts'

export default new Hono().get('/', acesso('admin'), async (c) => {
  const db = c.get('db')

  const usuarios = await db
    .select({
      id: schema.usuario.id,
      nome: schema.usuario.nome,
      email: schema.usuario.email,
      permissao: schema.usuario.permissao,
      dataInicio: schema.usuario.dataInicio,
      dataFim: schema.usuario.dataFim,
    })
    .from(schema.usuario)
    .catch((c) => handleDBError(c, 'Erro ao buscar usuários no banco de dados.'))
  
  if (!usuarios.length) {
    throw createHTTPException(
      404,
      'Usuários não encontrados.',
      'Array usuarios contém 0 elementos.',
    )
  }

  return c.json({
    message: 'Usuários enviados com sucesso.',
    usuarios: usuarios.map((usuario) =>
      usuario.permissao === 'admin'
        ? {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          permissao: 'admin',
        }
        : {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          permissao: 'estagiario',
          dataInicio: usuario.dataInicio,
          dataFim: usuario.dataFim,
        }
    ),
  }, 200)
})
