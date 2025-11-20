import { Hono } from 'hono'
import post from './post.ts'
import _delete from './delete.ts'
import patch from './patch.ts'

export default new Hono()
  .route('/contas', post)
  .route('/contas', patch)
  .route('/contas', _delete)
