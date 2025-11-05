import { Hono } from 'hono'
import { acesso } from '@/utils/permissao.ts'

export default new Hono().post('/', acesso('admin'), async c => {
  const db = c.req.valid('')
})
