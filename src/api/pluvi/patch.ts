import { Hono } from 'hono'
import { acesso } from '@/utils/permissao.ts'

export default new Hono().patch('/', acesso('admin'))
