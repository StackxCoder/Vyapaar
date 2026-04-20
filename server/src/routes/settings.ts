import { Router } from 'express'
import { db } from '../db'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { ok } from '../lib/response'
import { authenticate, AuthRequest } from '../middleware/authenticate'

const router = Router()

router.get('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const [config] = await db.select().from(settings).where(eq(settings.userId, authReq.userId!))
    ok(res, config || {})
  } catch (e) { next(e) }
})

router.put('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const data = req.body
    const [existing] = await db.select().from(settings).where(eq(settings.userId, authReq.userId!))
    let config;
    if (existing) {
      const [updated] = await db.update(settings).set({ ...data, updatedAt: new Date() }).where(eq(settings.userId, authReq.userId!)).returning()
      config = updated
    } else {
      const [created] = await db.insert(settings).values({ ...data, userId: authReq.userId! }).returning()
      config = created
    }
    ok(res, config)
  } catch (e) { next(e) }
})

export default router
