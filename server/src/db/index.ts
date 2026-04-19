import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import dotenv from 'dotenv'
dotenv.config()

neonConfig.fetchConnectionCache = true
neonConfig.poolQueryViaFetch = true

const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: { cache: 'no-store' }
})
export const db = drizzle(sql, { schema, logger: process.env.NODE_ENV === 'development' })
export type DB = typeof db
