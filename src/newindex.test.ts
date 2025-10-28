import { hc } from 'hono/client'
import type { AppType } from '@/main.ts'

const app = hc<AppType>('http://localhost:3000/')

const a = app.chuva.$get({ json: { data: '' } })
