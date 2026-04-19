import { Router } from 'express'
import { db } from '../db'
import { products, priceHistory, stockMovements } from '../db/schema'
import { eq, like, and, or, desc } from 'drizzle-orm'
import { z } from 'zod'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'

const router = Router()

const productSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['Wire', 'Cable', 'Accessories', 'Other']),
  labelSpec: z.string().min(1),
  actualSpec: z.string().min(1),
  unit: z.enum(['meter', 'coil', 'piece', 'kg', 'box']),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  batchStatus: z.enum(['trial', 'active', 'discontinued']).default('trial'),
  trackStock: z.boolean().default(false),
  currentStock: z.number().default(0),
  reorderLevel: z.number().default(0),
  reorderQuantity: z.number().default(0),
  notes: z.string().default(''),
})

router.get('/', async (req, res, next) => {
  try {
    const { search, category, status } = req.query
    const results = await db.select().from(products)
      .where(and(
        eq(products.isActive, true),
        category ? eq(products.category, category as string) : undefined,
        status ? eq(products.batchStatus, status as string) : undefined,
        search ? or(
          like(products.name, `%${search}%`),
          like(products.labelSpec, `%${search}%`)
        ) : undefined
      ))
      .orderBy(desc(products.updatedAt))
    ok(res, results)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [product] = await db.select().from(products).where(eq(products.id, req.params.id))
    if (!product) throw new AppError(404, 'Product not found')
    ok(res, product)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body)
    const [product] = await db.insert(products).values({
      ...data,
      purchasePrice: data.purchasePrice.toString(),
      sellingPrice: data.sellingPrice.toString(),
      currentStock: data.currentStock.toString(),
      reorderLevel: data.reorderLevel.toString(),
      reorderQuantity: data.reorderQuantity.toString(),
    }).returning()
    created(res, product, 'Product created')
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body)
    const [existing] = await db.select().from(products).where(eq(products.id, req.params.id))
    if (!existing) throw new AppError(404, 'Product not found')
    if (data.purchasePrice !== undefined || data.sellingPrice !== undefined) {
      await db.insert(priceHistory).values({
        productId: req.params.id,
        purchasePrice: existing.purchasePrice,
        sellingPrice: existing.sellingPrice,
        notes: 'Before update',
      })
    }
    const [updated] = await db.update(products)
      .set({ 
        ...data, 
        purchasePrice: data.purchasePrice?.toString(),
        sellingPrice: data.sellingPrice?.toString(),
        currentStock: data.currentStock?.toString(),
        reorderLevel: data.reorderLevel?.toString(),
        reorderQuantity: data.reorderQuantity?.toString(),
        updatedAt: new Date() 
      })
      .where(eq(products.id, req.params.id))
      .returning()
    ok(res, updated, 'Product updated')
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await db.update(products).set({ isActive: false }).where(eq(products.id, req.params.id))
    ok(res, null, 'Product deleted')
  } catch (e) { next(e) }
})

export default router
