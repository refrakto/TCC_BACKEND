import app from '@/main.ts'

Deno.serve(app.fetch)

Deno.test('POST /cadastro', async () => {
  const res = await app.request('/auth/cadastro', {
    method: 'POST',
    body: JSON.stringify([
      {
        nome: 'Jabaraabss',
        email: 'jabaracass@gmail.com',
        senha: 'asd12345345',
        permissao: 'estagiario',
        dataInicio: '2024-11-11',
      },
    ]),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
  console.log(await res.json())
})

let loginres: any
test('POST /login', async () => {
  const res = await app.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'jabarubs@gmail.com', senha: 'asd12345345' }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
  expect(res.status).toBe(200)
  loginres = await res.json()
  console.log(loginres)
})

test('GET /check', async () => {
  const res = await app.request('/auth/check', {
    method: 'GET',
    headers: new Headers({
      Authorization: `Bearer ${loginres.token}`,
    }),
  })
  expect(res.status).toBe(200)
  console.log(await res.json())
})
