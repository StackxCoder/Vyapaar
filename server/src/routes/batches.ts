import { Router } from 'express'
import { db } from '../db'
import { batches } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const result = await db.select().from(batches).orderBy(desc(batches.date))
    ok(res, result)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [batch] = await db.select().from(batches).where(eq(batches.id, req.params.id))
    if (!batch) throw new AppError(404, 'Batch not found')
    ok(res, batch)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const [batch] = await db.insert(batches).values({
      ...req.body,
      // Provide defaults
      status: req.body.status || 'trial',
      nextAction: req.body.nextAction || 'pending'
    }).returning()
    created(res, batch)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const [batch] = await db.update(batches)
      .set(req.body)
      .where(eq(batches.id, req.params.id))
      .returning()
    ok(res, batch)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await db.delete(batches).where(eq(batches.id, req.params.id))
    ok(res, { deletedId: req.params.id })
  } catch (e) { next(e) }
})

export default router
