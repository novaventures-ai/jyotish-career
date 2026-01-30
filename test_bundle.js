
import { app } from './api/_lib/bundled_app.js';

console.log('Successfully imported app');

// Mock Env Vars if needed
process.env.DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";
process.env.JWT_SECRET = "test_secret";

// Try to initialize or listen (if app exports a listen function, or just by importing it might trigger side effects)
console.log('App initialized');
