import { Hono } from 'hono'
import post from './post.ts'

export default new Hono()
  .route('/contas', post)
