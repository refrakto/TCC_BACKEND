import { Hono } from "hono"
import { acesso } from "utils/permissao"

export default new Hono().patch('/', acesso('admin'))