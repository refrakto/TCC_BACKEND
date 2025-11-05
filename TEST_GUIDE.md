# Test Guide - Auth & Contas API Routes

## Overview

This document provides a comprehensive guide for running and understanding the test suite for the authentication and account management API routes.

## Test File Location

- **Main Test File**: `src/main.test.ts`
- **Test Count**: 35 comprehensive tests
- **Coverage**: `/auth/*` and `/contas/*` endpoints

## Prerequisites

Before running tests, ensure:

1. **Environment Variables** are set in `.env`:
   ```env
   JWT_SECRET=your-secret-key-here
   DB_USUARIO=your-db-username
   DB_SENHA=your-db-password
   DB_NOME=your-db-name
   DB_HOST=localhost
   DB_PORT=5432
   ```

2. **Database** is running and accessible
3. **Database** is empty or test accounts don't exist (tests will cleanup)
4. **Server** is running on `http://localhost:8000` (default Deno.serve port)

## Running Tests

### Start the Server

In one terminal:
```bash
deno task start
```

### Run All Tests

In another terminal:
```bash
deno test --allow-net --allow-env --allow-read src/main.test.ts
```

### Run Specific Tests

```bash
# Run only auth tests
deno test --allow-net --allow-env --allow-read src/main.test.ts --filter "Auth"

# Run only contas tests
deno test --allow-net --allow-env --allow-read src/main.test.ts --filter "Contas"
```

### Run with Verbose Output

```bash
deno test --allow-net --allow-env --allow-read src/main.test.ts --reporter=dot
```

## Test Coverage

### Authentication Routes (`/auth/*`)

#### 1. **POST /auth/login** (7 tests)
- ✓ Fail with invalid credentials (404)
- ✓ Fail with invalid email format (422)
- ✓ Fail with short password (422)
- ✓ Login with admin credentials (200)
- ✓ Fail with wrong password (401)
- ✓ Login with estagiario credentials (200)
- ✓ Fail after account deletion (404)

#### 2. **GET /auth/check** (5 tests)
- ✓ Fail without token (422)
- ✓ Fail with invalid token format (422)
- ✓ Fail with malformed Bearer token (422)
- ✓ Validate admin token (200)
- ✓ Validate estagiario token (200)
- ✓ Fail with expired/invalid token after deletion (401)

#### 3. **POST /auth/logout** (3 tests)
- ✓ Fail without token (422)
- ✓ Logout successfully with admin token (200)
- ✓ Logout successfully with estagiario token (200)

### Account Management Routes (`/contas/*`)

#### 4. **POST /contas** (10 tests)
- ✓ Create admin account with JWT_SECRET (201)
- ✓ Fail creating duplicate admin (400)
- ✓ Create estagiario account with admin token (201)
- ✓ Create multiple accounts at once (201)
- ✓ Fail without admin token (422)
- ✓ Fail with empty array (422)
- ✓ Fail with invalid email (422)
- ✓ Fail with short password (422)
- ✓ Fail with dataFim before dataInicio (422)
- ✓ Fail with duplicate emails in request (400)
- ✓ Fail when estagiario tries to create account (403)

#### 5. **DELETE /contas** (7 tests)
- ✓ Fail without admin token (422)
- ✓ Delete account by id (200)
- ✓ Delete account by email (200)
- ✓ Fail deleting non-existent id (404)
- ✓ Fail deleting non-existent email (404)
- ✓ Fail with mismatched id and email (404)
- ✓ Delete admin account - cleanup (200)

## Test Flow Sequence

### Phase 1: Pre-Authentication Tests
Tests that don't require any accounts to exist in the database.

### Phase 2: Admin Account Creation
- Creates admin account using `JWT_SECRET` as a special bypass token
- This is allowed by the `acesso()` middleware for initial setup

### Phase 3: Admin Authentication
- Login as admin
- Validate admin token
- Test admin permissions

### Phase 4: Estagiario Account Creation
- Admin creates estagiario accounts
- Tests validation rules

### Phase 5: Estagiario Authentication
- Login as estagiario
- Validate estagiario token
- Test permission restrictions

### Phase 6: Logout Tests
- Both admin and estagiario can logout successfully

### Phase 7: Account Deletion
- Re-authenticate admin
- Test deletion by ID and email
- Test error cases

### Phase 8: Post-Deletion Verification
- Verify deleted accounts cannot login
- Verify tokens become invalid after account deletion

## Test Data

### Admin Test Account
```json
{
  "nome": "Admin Test",
  "email": "admin.test@example.com",
  "senha": "AdminPassword123!",
  "permissao": "admin"
}
```

### Estagiario Test Accounts
```json
{
  "nome": "Estagiario Test",
  "email": "estagiario.test@example.com",
  "senha": "EstagiarioPassword123!",
  "permissao": "estagiario",
  "dataInicio": "2024-01-01",
  "dataFim": "2024-12-31"
}
```

```json
{
  "nome": "Outro Estagiario",
  "email": "outro.estagiario@example.com",
  "senha": "OutroPassword123!",
  "permissao": "estagiario",
  "dataInicio": "2024-01-15"
}
```

## Special Features

### JWT_SECRET Bypass
The `acesso()` middleware in `src/utils/permissao.ts` includes a special check:

```typescript
if (token === new TextDecoder().decode(JWT_SECRET)) return
```

This allows using the raw JWT_SECRET as a Bearer token for initial admin account creation before any admin users exist. This is used in the first test to bootstrap the system.

### Email Normalization
All emails are automatically:
- Converted to lowercase
- Trimmed of whitespace

Tests verify this behavior.

### Permission Hierarchy
- **Admin**: Can create and delete accounts
- **Estagiario**: Cannot create or delete accounts (403 Forbidden)

## Expected Status Codes

| Endpoint | Method | Success | Auth Required | Status Codes |
|----------|--------|---------|---------------|--------------|
| /auth/login | POST | ✓ | No | 200, 401, 404, 422 |
| /auth/check | GET | ✓ | Yes | 200, 401, 422 |
| /auth/logout | POST | ✓ | Yes | 200, 422 |
| /contas | POST | ✓ | Yes (Admin) | 201, 400, 403, 422 |
| /contas | DELETE | ✓ | Yes (Admin) | 200, 404, 422 |

## Common Issues & Solutions

### Issue: Tests fail with "Connection refused"
**Solution**: Ensure the server is running on `http://localhost:8000`

### Issue: Tests fail with JWT errors
**Solution**: Verify JWT_SECRET is set in environment variables

### Issue: Tests fail with database errors
**Solution**: 
- Check database is running
- Verify database credentials in `.env`
- Ensure database schema is up to date (`deno task drizzle push`)

### Issue: Tests fail with "duplicate key" errors
**Solution**: 
- Test accounts already exist in database
- Either delete them manually or clear the test database

### Issue: Type check errors
**Solution**: 
- Run `deno check src/main.test.ts`
- Ensure `src/types/hono.d.ts` is referenced in `deno.jsonc`

## Database Cleanup

Tests are designed to cleanup after themselves by deleting all created accounts. However, if tests are interrupted, you may need to manually cleanup:

```sql
DELETE FROM usuario WHERE email IN (
  'admin.test@example.com',
  'estagiario.test@example.com',
  'outro.estagiario@example.com'
);
```

## Continuous Integration

For CI/CD pipelines, ensure:

1. Database is provisioned and accessible
2. Environment variables are set
3. Server starts successfully
4. Tests run with proper permissions
5. Database is cleaned up after tests

Example CI script:
```bash
#!/bin/bash
set -e

# Start database
docker-compose up -d postgres

# Wait for database
sleep 5

# Run migrations
deno task drizzle push

# Start server in background
deno task start &
SERVER_PID=$!

# Wait for server to be ready
sleep 3

# Run tests
deno test --allow-net --allow-env --allow-read src/main.test.ts

# Cleanup
kill $SERVER_PID
docker-compose down
```

## Contributing

When adding new tests:

1. Follow the existing naming convention: `Category - Method Route - description`
2. Group related tests together
3. Use descriptive assertions
4. Clean up test data if it persists beyond test scope
5. Update this guide with new test coverage

## Test Statistics

- **Total Tests**: 35
- **Auth Tests**: 15
- **Contas Tests**: 17
- **Integration Tests**: 3
- **Average Test Duration**: ~50-100ms per test
- **Total Suite Duration**: ~3-5 seconds

## Validation Rules Tested

### Email
- Must be valid email format
- Maximum 100 characters
- Automatically normalized to lowercase

### Password
- Minimum 8 characters
- Maximum 100 characters
- Hashed with Argon2 before storage

### Nome
- Maximum 100 characters
- Must match pattern: letters, spaces, hyphens, apostrophes

### Permissão
- Must be either "admin" or "estagiario"
- Estagiarios require dataInicio
- dataFim must be after dataInicio (if provided)

### Dates
- Must be ISO 8601 format (YYYY-MM-DD)
- dataFim is optional for estagiarios

## Security Testing

Tests verify:
- ✓ Unauthorized access is blocked (401/403)
- ✓ Invalid tokens are rejected
- ✓ Deleted user tokens become invalid
- ✓ Permission boundaries are enforced
- ✓ Input validation prevents malformed data
- ✓ Duplicate email prevention

## Next Steps

To extend test coverage, consider adding tests for:
- Token expiration (24h)
- Concurrent user operations
- Rate limiting
- SQL injection attempts
- XSS prevention
- Large payload handling
- Network timeout scenarios