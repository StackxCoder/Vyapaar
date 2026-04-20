import { Router } from 'express'
import { db } from '../db'
import { batches, products, stockMovements } from '../db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import { z } from 'zod'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/authenticate'

const router = Router()

const batchItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().positive(),
  costPerUnit: z.number().positive(),
  notes: z.string().default(''),
})

const batchSchema = z.object({
  manufacturerName: z.string().min(1),
  date: z.string().default(() => new Date().toISOString()),
  items: z.array(batchItemSchema).min(1),
  totalCost: z.number().positive(),
  status: z.enum(['trial', 'active', 'rejected']),
  marketResponse: z.string().default(''),
  nextAction: z.string().default('pending'),
  parentBatchId: z.string().nullable().optional(),
  notes: z.string().default(''),
})

router.get('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const results = await db.select().from(batches)
      .where(eq(batches.userId, authReq.userId!))
      .orderBy(desc(batches.date))
    ok(res, results)
  } catch (e) { next(e) }
})

router.post('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const data = batchSchema.parse(req.body)
    const [{ count }] = await db.select({ count: sql`count(*)` }).from(batches)
      .where(eq(batches.userId, authReq.userId!))
    const batchNumber = `BATCH-${String(Number(count) + 1).padStart(3, '0')}`

    const [batch] = await db.insert(batches).values({
      ...data,
      userId: authReq.userId!,
      batchNumber,
      date: new Date(data.date),
      totalCost: data.totalCost.toString(),
    }).returning()

    // Add incoming stock for the items immediately upon batch creation
    for (const item of data.items) {
      const [product] = await db.select().from(products).where(
        and(eq(products.id, item.productId), eq(products.userId, authReq.userId!))
      )
      if (product?.trackStock) {
        const before = Number(product.currentStock)
        const after = before + item.quantity
        await db.insert(stockMovements).values({
          userId: authReq.userId!,
          productId: item.productId,
          productName: item.productName,
          type: 'batch_in',
          direction: 'in',
          quantity: item.quantity.toString(),
          referenceId: batch.id,
          referenceType: 'batch',
          stockBefore: before.toString(),
          stockAfter: after.toString(),
        })
        await db.update(products)
          .set({ currentStock: after.toString() })
          .where(eq(products.id, item.productId))
      }
    }

    created(res, batch, 'Batch registered and stock added')
  } catch (e) { next(e) }
})

router.put('/:id', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const data = batchSchema.partial().parse(req.body)
    const [updated] = await db.update(batches)
      .set({ 
        ...data, 
        date: data.date ? new Date(data.date) : undefined,
        totalCost: data.totalCost?.toString(),
        updatedAt: new Date() 
      })
      .where(and(eq(batches.id, req.params.id), eq(batches.userId, authReq.userId!)))
      .returning()
    ok(res, updated, 'Batch updated')
  } catch (e) { next(e) }
})

export default router
