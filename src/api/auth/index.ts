import { Hono } from 'hono'
import check from './check'
import login from './login'
import logout from './logout'

export default new Hono()
  .route('/auth', check)
  .route('/auth', login)
  .route('/auth', logout)
