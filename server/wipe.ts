import { db } from './src/db/index'
import { sql } from 'drizzle-orm'

async function clearDb() {
  console.log('Dropping schema public cascade...')
  await db.execute(sql`DROP SCHEMA public CASCADE;`)
  await db.execute(sql`CREATE SCHEMA public;`)
  console.log('Done.')
  process.exit(0)
}
clearDb()
