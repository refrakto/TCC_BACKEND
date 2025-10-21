import { expect, test } from 'bun:test'
import app from '.'
import { startServer } from '.'

await startServer()

/*
test('POST /cadastro', async () => {
  const res = await app.request('/auth/cadastro', {
    method: 'POST',
    body: JSON.stringify([
      {
        nome: 'Jabarweaed',
        email: 'jabaweas@gmail.com',
        senha: 'asd12345345',
        permissao: 'estagiario',
        dataInicio: '2024-11-11',
      },
    ]),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
  expect(res.status).toBe(201)
  console.log(await res.json())
})
*/

test('POST /login', async () => {
  const res = await app.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'jabarubs@gmail.com', senha: 'asd12345345' }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
  expect(res.status).toBe(200)
  console.log(await res.json())
})

test('GET /check', async () => {
  const res = await app.request('/auth/check', {
    method: 'GET',
    headers: new Headers({
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MywicGVybWlzc2FvIjoiZXN0YWdpYXJpbyIsImV4cCI6MTc2MTAyNTAyMX0.7d18b8QA24QbhDhcOaj8n78PdoFIMHmW5J9bsimW8hE',
    }),
  })
  expect(res.status).toBe(200)
  console.log(await res.json())
})
