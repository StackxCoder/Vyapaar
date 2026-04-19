import { Router } from 'express'
import { db } from '../db'
import { payments } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'

const router = Router()
const paymentSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  date: z.string().default(() => new Date().toISOString()),
  amount: z.number().positive(),
  mode: z.enum(['cash', 'neft', 'upi', 'cheque']),
  reference: z.string().default(''),
  notes: z.string().default(''),
})

router.get('/', async (req, res, next) => {
  try {
    const result = await db.select().from(payments).orderBy(desc(payments.date))
    ok(res, result)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [payment] = await db.select().from(payments).where(eq(payments.id, req.params.id))
    if (!payment) throw new AppError(404, 'Payment not found')
    ok(res, payment)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const data = paymentSchema.parse(req.body)
    const [payment] = await db.insert(payments).values({
      ...data, date: new Date(data.date), amount: data.amount.toString(),
    }).returning()
    created(res, payment)
  } catch (e) { next(e) }
})

export default router
