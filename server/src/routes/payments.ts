import { Router } from 'express'
import { db } from '../db'
import { payments } from '../db/schema'
import { eq, desc, gte, lte, and } from 'drizzle-orm'
import { z } from 'zod'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/authenticate'

const router = Router()

const paymentSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  date: z.string().default(() => new Date().toISOString()),
  amount: z.number().positive(),
  mode: z.string().default('cash'),
  reference: z.string().default(''),
  notes: z.string().default(''),
})

router.get('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const { from, to, customerId } = req.query
    const result = await db.select().from(payments)
      .where(and(
        eq(payments.userId, authReq.userId!),
        from ? gte(payments.date, new Date(from as string)) : undefined,
        to ? lte(payments.date, new Date(to as string)) : undefined,
        customerId ? eq(payments.customerId, customerId as string) : undefined,
      ))
      .orderBy(desc(payments.date))
    ok(res, result)
  } catch (e) { next(e) }
})

router.post('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const data = paymentSchema.parse(req.body)
    const [payment] = await db.insert(payments).values({
      ...data,
      userId: authReq.userId!,
      date: new Date(data.date),
      amount: data.amount.toString(),
    }).returning()
    created(res, payment, 'Payment recorded')
  } catch (e) { next(e) }
})

export default router
