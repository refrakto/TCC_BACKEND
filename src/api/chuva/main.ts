import { Hono } from 'hono'
import post from './post.ts'
import get from './get.ts'
import patch from './patch.ts'

export default new Hono()
  .route('/chuva', post)
  .route('/chuva', get)
  .route('/chuva', patch)
