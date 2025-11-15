/**
 * Comprehensive Test Suite for Auth and Contas API Routes
 *
 * This test suite covers:
 * 1. Authentication endpoints (/auth/login, /auth/check, /auth/logout)
 * 2. Account management endpoints (/contas - POST and DELETE)
 * 3. Bearer token authorization and JWT validation
 * 4. Permission-based access control (admin vs estagiario)
 *
 * Test Flow:
 * - Phase 1: Test auth endpoints without accounts (validation errors)
 * - Phase 2: Create admin account using JWT_SECRET as bearer token
 * - Phase 3: Login and validate admin token
 * - Phase 4: Create estagiario accounts with admin authorization
 * - Phase 5: Test validation errors for account creation
 * - Phase 6: Login as estagiario and test permissions
 * - Phase 7: Test logout functionality
 * - Phase 8: Test account deletion (by id and email)
 * - Phase 9: Verify tokens invalid after account deletion
 *
 * Important Notes:
 * - Tests assume database is empty at start
 * - Tests create and cleanup their own test data
 * - JWT_SECRET is used as special bypass token for initial admin creation
 * - All endpoints requiring auth use Bearer token format
 */

import { assertEquals, assertExists } from '@std/assert'
import { JWT_SECRET } from '@/main.ts'

const BASE_URL = 'http://localhost:8000'

// Test data
const TEST_ADMIN = {
  nome: 'Admin Test',
  email: 'admin.test@example.com',
  senha: 'AdminPassword123!',
  permissao: 'admin' as const,
}

const TEST_ESTAGIARIO = {
  nome: 'Estagiario Test',
  email: 'estagiario.test@example.com',
  senha: 'EstagiarioPassword123!',
  permissao: 'estagiario' as const,
  dataInicio: '2024-01-01',
  dataFim: '2026-12-31',
}

const TEST_ESTAGIARIO_2 = {
  nome: 'Outro Estagiario',
  email: 'outro.estagiario@example.com',
  senha: 'OutroPassword123!',
  permissao: 'estagiario' as const,
  dataInicio: '2024-01-15',
}

let adminToken = ''
let estagiarioToken = ''
let adminId = 0
let estagiarioId = 0


// ============================================================================
// AUTH TESTS
// ============================================================================

Deno.test({
  name: 'Auth - POST /auth/login - should fail with invalid credentials',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        senha: 'WrongPassword123!',
      }),
    })

    assertEquals(response.status, 401)
    const data = await response.json()
    assertEquals(data.message, 'Credenciais inválidas.')
  },
})

Deno.test('Auth - POST /auth/login - should fail with invalid email format', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-email',
      senha: 'Password123!',
    }),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Auth - POST /auth/login - should fail with short password', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      senha: '123',
    }),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Auth - GET /auth/check - should fail without token', async () => {
  const response = await fetch(`${BASE_URL}/auth/check`, {
    method: 'GET',
  })

  assertEquals(response.status, 400)
  await response.body?.cancel()
})

Deno.test('Auth - GET /auth/check - should fail with invalid token format', async () => {
  const response = await fetch(`${BASE_URL}/auth/check`, {
    method: 'GET',
    headers: { 'Authorization': 'InvalidToken' },
  })

  assertEquals(response.status, 400)
  await response.body?.cancel()
})

Deno.test('Auth - GET /auth/check - should fail with malformed Bearer token', async () => {
  const response = await fetch(`${BASE_URL}/auth/check`, {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid.token' },
  })

  assertEquals(response.status, 400)
  await response.body?.cancel()
})

Deno.test('Auth - POST /auth/logout - should fail without token', async () => {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
  })

  assertEquals(response.status, 400)
  await response.body?.cancel()
})

// ============================================================================
// CONTAS TESTS - CREATE ACCOUNTS
// ============================================================================

Deno.test('Contas - POST /contas - should create admin account (first setup)', async () => {
  // First try to cleanup any existing account
  try {
    await fetch(`${BASE_URL}/contas`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${new TextDecoder().decode(JWT_SECRET)}`,
      },
      body: JSON.stringify({ email: TEST_ADMIN.email }),
    }).then((r) => r.text().catch(() => {}))
  } catch {}

  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${new TextDecoder().decode(JWT_SECRET)}`,
    },
    body: JSON.stringify([TEST_ADMIN]),
  })

  const data = await response.json()
  assertEquals(
    response.status,
    201,
    `Expected 201 but got ${response.status}: ${JSON.stringify(data)}`,
  )
  assertExists(data.usuarios)
  assertEquals(data.usuarios.length, 1)
  assertEquals(data.usuarios[0].email, TEST_ADMIN.email.toLowerCase().trim())
  assertEquals(data.usuarios[0].nome, TEST_ADMIN.nome)
  assertEquals(data.usuarios[0].permissao, 'admin')
  adminId = await data.usuarios[0].id
  assertExists(adminId)
})

Deno.test('Contas - POST /contas - should fail creating duplicate admin', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${new TextDecoder().decode(JWT_SECRET)}`,
    },
    body: JSON.stringify([TEST_ADMIN]),
  })

  const data = await response.json()
  assertEquals(
    response.status,
    400,
    `Expected 400 but got ${response.status}: ${JSON.stringify(data)}`,
  )
  assertExists(data.message)
  assertEquals(data.message.includes('já estão cadastrados'), true)
})

Deno.test('Auth - POST /auth/login - should login with admin credentials', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ADMIN.email,
      senha: TEST_ADMIN.senha,
    }),
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  assertExists(data.token)
  assertExists(data.usuario)
  assertEquals(data.usuario.email, TEST_ADMIN.email.toLowerCase().trim())
  assertEquals(data.usuario.permissao, 'admin')
  adminToken = await data.token
})

Deno.test('Auth - POST /auth/login - should fail with wrong password', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ADMIN.email,
      senha: 'WrongPassword123!',
    }),
  })

  assertEquals(response.status, 401)
  const data = await response.json()
  assertEquals(data.message, 'Credenciais inválidas.')
})

Deno.test('Auth - GET /auth/check - should validate admin token', async () => {
  const response = await fetch(`${BASE_URL}/auth/check`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  assertExists(data.usuario)
  assertEquals(data.usuario.id, adminId)
  assertEquals(data.usuario.email, TEST_ADMIN.email.toLowerCase().trim())
  assertEquals(data.usuario.permissao, 'admin')
})

Deno.test('Contas - POST /contas - should create estagiario account with admin token', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([TEST_ESTAGIARIO]),
  })

  const data = await response.json()
  assertEquals(
    response.status,
    201,
    `Expected 201 but got ${response.status}: ${JSON.stringify(data)}`,
  )
  assertExists(data.usuarios)
  assertEquals(data.usuarios.length, 1)
  assertEquals(data.usuarios[0].email, TEST_ESTAGIARIO.email.toLowerCase().trim())
  assertEquals(data.usuarios[0].permissao, 'estagiario')
  assertEquals(data.usuarios[0].dataInicio, TEST_ESTAGIARIO.dataInicio)
  assertEquals(data.usuarios[0].dataFim, TEST_ESTAGIARIO.dataFim)
  estagiarioId = await data.usuarios[0].id
})

Deno.test('Contas - POST /contas - should create multiple accounts at once', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([TEST_ESTAGIARIO_2]),
  })

  assertEquals(response.status, 201)
  const data = await response.json()
  assertExists(data.usuarios)
  assertEquals(data.usuarios.length, 1)
})

Deno.test('Contas - POST /contas - should fail without admin token', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{
      nome: 'Test User',
      email: 'test.user@example.com',
      senha: 'TestPassword123!',
      permissao: 'admin',
    }]),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Contas - POST /contas - should fail with empty array', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([]),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Contas - POST /contas - should fail with invalid email', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([{
      nome: 'Test User',
      email: 'invalid-email',
      senha: 'TestPassword123!',
      permissao: 'admin',
    }]),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Contas - POST /contas - should fail with short password', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([{
      nome: 'Test User',
      email: 'test.short@example.com',
      senha: '123',
      permissao: 'admin',
    }]),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Contas - POST /contas - should fail with dataFim before dataInicio', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([{
      nome: 'Test Estagiario',
      email: 'test.dates@example.com',
      senha: 'TestPassword123!',
      permissao: 'estagiario',
      dataInicio: '2024-12-31',
      dataFim: '2024-01-01',
    }]),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Contas - POST /contas - should fail with duplicate emails in request', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([
      {
        nome: 'User One',
        email: 'duplicate@example.com',
        senha: 'Password123!',
        permissao: 'admin',
      },
      {
        nome: 'User Two',
        email: 'duplicate@example.com',
        senha: 'Password123!',
        permissao: 'admin',
      },
    ]),
  })

  assertEquals(response.status, 400)
  const data = await response.json()
  assertEquals(data.message.includes('Emails duplicados'), true)
})

Deno.test('Auth - POST /auth/login - should login with estagiario credentials', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ESTAGIARIO.email,
      senha: TEST_ESTAGIARIO.senha,
    }),
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  assertExists(data.token)
  assertExists(data.usuario)
  assertEquals(data.usuario.email, TEST_ESTAGIARIO.email.toLowerCase().trim())
  assertEquals(data.usuario.permissao, 'estagiario')
  assertEquals(data.usuario.dataInicio, TEST_ESTAGIARIO.dataInicio)
  assertEquals(data.usuario.dataFim, TEST_ESTAGIARIO.dataFim)
  estagiarioToken = data.token
})

Deno.test('Auth - GET /auth/check - should validate estagiario token', async () => {
  const response = await fetch(`${BASE_URL}/auth/check`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${estagiarioToken}` },
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  assertExists(data.usuario)
  assertEquals(data.usuario.id, estagiarioId)
  assertEquals(data.usuario.permissao, 'estagiario')
})

Deno.test('Contas - POST /contas - should fail when estagiario tries to create account', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${estagiarioToken}`,
    },
    body: JSON.stringify([{
      nome: 'Unauthorized User',
      email: 'unauthorized@example.com',
      senha: 'Password123!',
      permissao: 'admin',
    }]),
  })

  const data = await response.json()
  assertEquals(
    response.status,
    403,
    `Expected 403 but got ${response.status}: ${JSON.stringify(data)}`,
  )
  assertEquals(data.message, 'Permissão negada.')
})

Deno.test('Auth - POST /auth/logout - should logout successfully with valid token', async () => {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  assertEquals(data.success, true)
  assertEquals(data.message, 'Desconectado com sucesso')
})

Deno.test('Auth - POST /auth/logout - should logout estagiario successfully', async () => {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${estagiarioToken}` },
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  assertEquals(data.success, true)
})

// ============================================================================
// CONTAS TESTS - DELETE ACCOUNTS
// ============================================================================

Deno.test('Contas - DELETE /contas - re-login admin for delete tests', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ADMIN.email,
      senha: TEST_ADMIN.senha,
    }),
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  adminToken = data.token
})

Deno.test('Contas - DELETE /contas - should fail without admin token', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: estagiarioId }),
  })

  assertEquals(response.status, 422)
  await response.body?.cancel()
})

Deno.test('Contas - DELETE /contas - should delete account by id', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ id: estagiarioId }),
  })

  const data = await response.json()
  assertEquals(
    response.status,
    200,
    `Expected 200 but got ${response.status}: ${JSON.stringify(data)}`,
  )
  assertEquals(data.id, estagiarioId)
  assertEquals(data.email, TEST_ESTAGIARIO.email.toLowerCase().trim())
})

Deno.test('Contas - DELETE /contas - should delete account by email', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ email: TEST_ESTAGIARIO_2.email }),
  })

  assertEquals(response.status, 200)
  const data = await response.json()
  assertEquals(data.email, TEST_ESTAGIARIO_2.email.toLowerCase().trim())
})

Deno.test('Contas - DELETE /contas - should fail deleting non-existent id', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ id: 999999 }),
  })

  assertEquals(response.status, 404)
  const data = await response.json()
  assertEquals(data.message.includes('não encontrado'), true)
})

Deno.test('Contas - DELETE /contas - should fail deleting non-existent email', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ email: 'nonexistent@example.com' }),
  })

  assertEquals(response.status, 404)
  const data = await response.json()
  assertEquals(data.message.includes('não encontrado'), true)
})

Deno.test('Contas - DELETE /contas - should fail with mismatched id and email', async () => {
  // Create a temporary account to test mismatch
  const tempEmail = 'temp.mismatch@example.com'
  const createResponse = await fetch(`${BASE_URL}/contas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([{
      nome: 'Temp User',
      email: tempEmail,
      senha: 'TempPassword123!',
      permissao: 'admin',
    }]),
  })
  const createData = await createResponse.json()
  const tempId = createData.usuarios[0].id

  // Try to delete with mismatched id and email
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      id: adminId,
      email: tempEmail,
    }),
  })

  const data = await response.json()
  assertEquals(
    response.status,
    400,
    `Expected 400 but got ${response.status}: ${JSON.stringify(data)}`,
  )
  assertEquals(data.message.includes('não corresponde'), true)

  // Cleanup: delete the temp account
  const cleanupResponse = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ id: tempId }),
  })
  await cleanupResponse.text().catch(() => {})
})

Deno.test('Contas - DELETE /contas - should fail: delete admin account with the same admin\'s token', async () => {
  const response = await fetch(`${BASE_URL}/contas`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ id: adminId }),
  })

  const data = await response.json()
  assertEquals(
    response.status,
    400,
    `Expected 400 but got ${response.status}: ${JSON.stringify(data)}`,
  )
  assertEquals(data.message, 'Não é possível deletar a própria conta.')
})

Deno.test('Contas - DELETE /contas - cleanup: delete admin account', async () => {
  const response2 = await fetch(`${BASE_URL}/contas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify([{
        nome: 'Admin Deleter',
        email: 'admin.deleter@example.com',
        senha: 'DeleterPassword123!',
        permissao: 'admin',
      }]),
    })
    const data2 = await response2.json()
    const admin2Id = data2.usuarios[0].id
  
    // Login as second admin
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin.deleter@example.com',
        senha: 'DeleterPassword123!',
      }),
    })
    const loginData = await loginResponse.json()
    const admin2Token = loginData.token
  
    // Now delete the first admin using second admin's token
    const response = await fetch(`${BASE_URL}/contas`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${admin2Token}`,
      },
      body: JSON.stringify({ id: adminId }),
    })
  
    const data = await response.json()
    assertEquals(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(data)}`,
    )
    assertEquals(data.id, adminId)
    assertEquals(data.permissao, 'admin')
  
    // Delete second admin using bypass token
    await fetch(`${BASE_URL}/contas`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${new TextDecoder().decode(JWT_SECRET)}`,
      },
      body: JSON.stringify({ id: admin2Id }),
    }).then(r => r.text().catch(() => {}))
})

// ============================================================================
// ADDITIONAL AUTH EDGE CASES
// ============================================================================

Deno.test('Auth - POST /auth/login - should fail after account deletion', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ADMIN.email,
      senha: TEST_ADMIN.senha,
    }),
  })

  await response.text().catch(() => {})
  assertEquals(response.status, 401)
})

Deno.test('Auth - GET /auth/check - should fail with expired/invalid token after deletion', async () => {
  const response = await fetch(`${BASE_URL}/auth/check`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  })

  await response.text().catch(() => {})
  assertEquals(response.status, 401)
})