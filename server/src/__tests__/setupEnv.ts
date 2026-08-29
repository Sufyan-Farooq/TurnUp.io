// Ensures required environment variables are present before any application module
// (which may throw at import-time, e.g. services/auth.ts requiring JWT_SECRET) is loaded.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret-do-not-use-in-production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test_db';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
