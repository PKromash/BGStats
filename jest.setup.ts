// jest.setup.ts
// Provide a dummy DATABASE_URL so lib/db.ts does not throw at import time
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost/test'
