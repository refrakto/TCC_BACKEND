import { Hono } from 'hono'
import post from './post.ts'
import _delete from './delete.ts'

export default new Hono()
  .route('/contas', post)
  .route('/contas', _delete)
