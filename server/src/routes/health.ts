import { Router } from 'express'
import { db } from '../db'
import { sql } from 'drizzle-orm'
const router = Router()
router.get('/', async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`)
    res.json({ status: 'healthy', db: 'connected', timestamp: new Date(), uptime: process.uptime() })
  } catch {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' })
  }
})
export default router
