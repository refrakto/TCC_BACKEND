import { Hono } from 'hono'
import check from './check.ts'
import login from './login.ts'
import logout from './logout.ts'

export default new Hono()
  .route('/auth', check)
  .route('/auth', login)
  .route('/auth', logout)
