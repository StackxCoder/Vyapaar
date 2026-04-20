import { Router } from 'express'
import { db } from '../db'
import { sales, products, stockMovements } from '../db/schema'
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/authenticate'

const router = Router()

const saleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  labelSpec: z.string(),
  unit: z.string(),
  quantity: z.number().positive(),
  rate: z.number().positive(),
  amount: z.number().positive(),
})

const saleSchema = z.object({
  date: z.string().default(() => new Date().toISOString()),
  customerId: z.string().nullable(),
  customerName: z.string(),
  saleMode: z.enum(['pukka', 'kachcha']),
  items: z.array(saleItemSchema).min(1),
  subtotal: z.number(),
  discount: z.number().default(0),
  total: z.number(),
  paymentType: z.enum(['cash', 'credit', 'partial']),
  cashReceived: z.number().default(0),
  creditAmount: z.number().default(0),
  notes: z.string().default(''),
})

router.get('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const { from, to, customerId, mode } = req.query
    const result = await db.select().from(sales)
      .where(and(
        eq(sales.userId, authReq.userId!),
        from ? gte(sales.date, new Date(from as string)) : undefined,
        to ? lte(sales.date, new Date(to as string)) : undefined,
        customerId ? eq(sales.customerId, customerId as string) : undefined,
        mode ? eq(sales.saleMode, mode as string) : undefined,
      ))
      .orderBy(desc(sales.date))
    ok(res, result)
  } catch (e) { next(e) }
})

router.get('/:id', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const [sale] = await db.select().from(sales).where(
      and(eq(sales.id, req.params.id), eq(sales.userId, authReq.userId!))
    )
    if (!sale) throw new AppError(404, 'Sale not found')
    ok(res, sale)
  } catch (e) { next(e) }
})

router.post('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const data = saleSchema.parse(req.body)
    let saleNumber = null
    if (data.saleMode === 'pukka') {
      const [{ count }] = await db.select({ count: sql`count(*)` }).from(sales)
        .where(and(eq(sales.saleMode, 'pukka'), eq(sales.userId, authReq.userId!)))
      saleNumber = `SALE-${String(Number(count) + 1).padStart(4, '0')}`
    }
    const [sale] = await db.insert(sales).values({
      ...data, 
      userId: authReq.userId!,
      saleNumber, date: new Date(data.date),
      subtotal: data.subtotal.toString(), discount: data.discount.toString(),
      total: data.total.toString(), cashReceived: data.cashReceived.toString(),
      creditAmount: data.creditAmount.toString(),
    }).returning()
    // Auto-deduct stock for tracked products
    for (const item of data.items) {
      const [product] = await db.select().from(products).where(
        and(eq(products.id, item.productId), eq(products.userId, authReq.userId!))
      )
      if (product?.trackStock) {
        const before = Number(product.currentStock)
        const after = before - item.quantity
        await db.insert(stockMovements).values({
          userId: authReq.userId!,
          productId: item.productId, productName: item.productName,
          type: 'sale_out', direction: 'out',
          quantity: item.quantity.toString(),
          referenceId: sale.id, referenceType: 'sale',
          stockBefore: before.toString(), stockAfter: after.toString(),
        })
        await db.update(products).set({ currentStock: after.toString() })
          .where(eq(products.id, item.productId))
      }
    }
    created(res, sale, 'Sale created')
  } catch (e) { next(e) }
})

export default router
