import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function runMigrations() {
  console.log('⏳ Forcing database migration through Port 443 (HTTP)...');
  try {
    await migrate(db, { migrationsFolder: path.resolve(__dirname, '../drizzle') });
    console.log('✅ Migrations completed successfully! Your tables are live.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
