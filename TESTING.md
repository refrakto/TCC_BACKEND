# Testing Guide

## Quick Start

### Run Tests (tests start their own server automatically)
```bash
deno task test
```

The tests will:
1. ✅ Start the test server automatically
2. ✅ Run all 37 tests
3. ✅ Stop the server when done

## Test Coverage

### Authentication (`/auth/*`)
- ✅ POST `/auth/login` - User authentication with email/password
- ✅ GET `/auth/check` - Token validation and user info retrieval
- ✅ POST `/auth/logout` - User logout

### Account Management (`/contas/*`)
- ✅ POST `/contas` - Create user accounts (admin only)
- ✅ DELETE `/contas` - Delete user accounts (admin only)

**Total: 35 comprehensive tests**

## Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| Auth - Login | 7 | Valid/invalid credentials, email format, passwords |
| Auth - Check | 6 | Token validation, malformed tokens, deleted users |
| Auth - Logout | 3 | Logout success, missing tokens |
| Contas - Create | 11 | Account creation, validation, permissions |
| Contas - Delete | 8 | Account deletion by ID/email, error cases |

## Prerequisites

1. **Environment Variables** (`.env` file):
```env
JWT_SECRET=your-secret-key-here
DB_USUARIO=your-database-username
DB_SENHA=your-database-password
DB_NOME=your-database-name
DB_HOST=localhost
DB_PORT=5432
```

2. **Database**:
   - PostgreSQL running and accessible
   - Schema migrated: `deno task drizzle push`

3. **Server**:
   - Running on `http://localhost:8000` (default)

## Test Flow

```
1. Start test server
2. Pre-Auth Tests → Test endpoints without accounts
3. Create Admin → Use JWT_SECRET as bypass token
4. Admin Login → Get admin JWT token
5. Create Estagiarios → Admin creates test accounts
6. Estagiario Login → Get estagiario JWT token
7. Permission Tests → Verify access control
8. Logout Tests → Both user types
9. Delete Tests → Remove accounts by ID/email
10.Post-Delete Tests → Verify tokens invalid
11.Stop test server
```

## Special Features

### JWT_SECRET Bypass
For initial setup, the raw `JWT_SECRET` can be used as a Bearer token to create the first admin account:

```typescript
Authorization: Bearer ${new TextDecoder().decode(JWT_SECRET)}
```

This is only for bootstrapping before any admin exists.

### Test Accounts
- **Admin**: `admin.test@example.com` / `AdminPassword123!`
- **Estagiario 1**: `estagiario.test@example.com` / `EstagiarioPassword123!`
- **Estagiario 2**: `outro.estagiario@example.com` / `OutroPassword123!`

Tests automatically create and cleanup these accounts.

## Running Specific Tests

```bash
# Only auth tests
deno test --allow-net --allow-env --allow-read src/main.test.ts --filter "Auth"

# Only contas tests
deno test --allow-net --allow-env --allow-read src/main.test.ts --filter "Contas"

# Only login tests
deno test --allow-net --allow-env --allow-read src/main.test.ts --filter "login"

# Only delete tests
deno test --allow-net --allow-env --allow-read src/main.test.ts --filter "DELETE"
```

## Common Issues

### Connection Refused
❌ **Problem**: Tests fail with connection error  
✅ **Solution**: Port 8000 might be in use. Stop any other servers on that port.

### JWT Errors
❌ **Problem**: Token validation fails  
✅ **Solution**: Verify `JWT_SECRET` is set in `.env`

### Database Errors
❌ **Problem**: Cannot connect to database  
✅ **Solution**: 
- Check PostgreSQL is running
- Verify credentials in `.env`
- Run migrations: `deno task drizzle push`

### Duplicate Key Errors
❌ **Problem**: Test accounts already exist  
✅ **Solution**: Cleanup database or delete test accounts manually

## Expected Results

All tests should pass with green checkmarks:

```
running 37 tests from ./src/main.test.ts
Setup - Start test server ... ok
Auth - POST /auth/login - should fail with invalid credentials ... ok
Auth - POST /auth/login - should fail with invalid email format ... ok
Auth - POST /auth/login - should fail with short password ... ok
Auth - GET /auth/check - should fail without token ... ok
...
Stop test server ... ok
test result: ok. 37 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

## Manual Cleanup (if needed)

If tests are interrupted, cleanup test accounts:

```sql
DELETE FROM usuario WHERE email IN (
  'admin.test@example.com',
  'estagiario.test@example.com',
  'outro.estagiario@example.com'
);
```

## Type Checking

Before running tests, verify types:

```bash
deno check src/main.test.ts
```

Should output: `Check file:///A:/tcc/BACKEND_DENO/src/main.test.ts` with no errors.

## What Each Test Verifies

### Validation
- ✅ Email format and length
- ✅ Password length (8-100 chars)
- ✅ Nome format (letters, spaces, hyphens)
- ✅ Date formats (ISO 8601)
- ✅ Date logic (dataFim after dataInicio)

### Security
- ✅ Unauthorized access blocked (401/403)
- ✅ Invalid tokens rejected
- ✅ Deleted user tokens become invalid
- ✅ Permission boundaries enforced
- ✅ Admin-only operations protected

### Business Logic
- ✅ Duplicate emails prevented
- ✅ Account creation/deletion
- ✅ Token generation/validation
- ✅ User authentication
- ✅ Email normalization (lowercase + trim)

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - name: Run migrations
        run: deno task drizzle push
      - name: Start server
        run: deno task start &
      - name: Run tests
        run: deno test --allow-net --allow-env --allow-read src/main.test.ts
```

## More Information

For detailed documentation, see [`TEST_GUIDE.md`](./TEST_GUIDE.md).

## Test Statistics

- **Total Tests**: 35
- **Success Rate**: Should be 100%
- **Average Duration**: ~50-100ms per test
- **Total Duration**: ~3-5 seconds
- **Coverage**: All critical auth and account management flows

---

**Last Updated**: Auto-generated test documentation  
**Test File**: `src/main.test.ts`  
**Framework**: Deno Standard Testing + @std/assert  
**Server Management**: Automatic (tests start/stop their own server)