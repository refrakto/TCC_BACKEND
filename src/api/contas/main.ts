import { Hono } from 'hono'
import post from './post.ts'
import deleteMethod from './delete.ts'

export default new Hono()
  .route('/contas', post)
  .route('/contas', deleteMethod)
