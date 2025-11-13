import { Hono } from 'hono'
import post from './post.ts'
import get from './get.ts'
import patch from './patch.ts'
import _delete from './delete.ts'

export default new Hono()
  .route('/pluvi', post)
  .route('/pluvi', get)
  .route('/pluvi', patch)
  .route('/pluvi', _delete)
