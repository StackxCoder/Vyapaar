import { Router } from 'express'
import { db } from '../db'
import { customers, sales, payments } from '../db/schema'
import { eq, sql, desc, and } from 'drizzle-orm'
import { z } from 'zod'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/authenticate'

const router = Router()

const customerSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().default(''),
  phone: z.string().default(''),
  city: z.string().default(''),
  address: z.string().default(''),
  creditLimit: z.number().default(0),
  paymentTerms: z.string().default('immediate'),
  pricingTier: z.enum(['standard', 'premium', 'bulk', 'custom']).default('standard'),
  customDiscountPercent: z.number().default(0),
  notes: z.string().default(''),
})

router.get('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const result = await db.select({
      id: customers.id,
      companyName: customers.companyName,
      contactPerson: customers.contactPerson,
      phone: customers.phone,
      city: customers.city,
      creditLimit: customers.creditLimit,
      paymentTerms: customers.paymentTerms,
      pricingTier: customers.pricingTier,
      customDiscountPercent: customers.customDiscountPercent,
      specialPrices: customers.specialPrices,
      notes: customers.notes,
      createdAt: customers.createdAt,
      udhaar: sql`
        COALESCE((SELECT SUM(credit_amount::numeric) FROM sales WHERE customer_id = customers.id), 0)
        - COALESCE((SELECT SUM(amount::numeric) FROM payments WHERE customer_id = customers.id), 0)
      `.as('udhaar'),
    }).from(customers)
      .where(and(eq(customers.userId, authReq.userId!), eq(customers.isActive, true)))
      .orderBy(desc(customers.createdAt))
    ok(res, result)
  } catch (e) { next(e) }
})

router.get('/:id', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const [customer] = await db.select({
      id: customers.id,
      companyName: customers.companyName,
      contactPerson: customers.contactPerson,
      phone: customers.phone,
      city: customers.city,
      creditLimit: customers.creditLimit,
      paymentTerms: customers.paymentTerms,
      pricingTier: customers.pricingTier,
      customDiscountPercent: customers.customDiscountPercent,
      specialPrices: customers.specialPrices,
      notes: customers.notes,
      createdAt: customers.createdAt,
      udhaar: sql`
        COALESCE((SELECT SUM(credit_amount::numeric) FROM sales WHERE customer_id = customers.id), 0)
        - COALESCE((SELECT SUM(amount::numeric) FROM payments WHERE customer_id = customers.id), 0)
      `.as('udhaar'),
    }).from(customers)
      .where(and(eq(customers.id, req.params.id), eq(customers.userId, authReq.userId!)))
    
    if (!customer) throw new AppError(404, 'Customer not found')
    ok(res, customer)
  } catch (e) { next(e) }
})

router.get('/:id/ledger', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const salesData = await db.select().from(sales)
      .where(and(eq(sales.customerId, req.params.id), eq(sales.userId, authReq.userId!)))
      .orderBy(desc(sales.date))
    const paymentsData = await db.select().from(payments)
      .where(and(eq(payments.customerId, req.params.id), eq(payments.userId, authReq.userId!)))
      .orderBy(desc(payments.date))
    const allTx = [
      ...salesData.map(s => ({ ...s, txType: 'sale', amount: s.creditAmount })),
      ...paymentsData.map(p => ({ ...p, txType: 'payment' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let runningBalance = 0
    const ledger = allTx.reverse().map(tx => {
      if (tx.txType === 'sale') runningBalance += Number(tx.amount)
      else runningBalance -= Number((tx as any).amount)
      return { ...tx, balance: runningBalance }
    }).reverse()
    ok(res, { ledger, currentUdhaar: runningBalance })
  } catch (e) { next(e) }
})

router.post('/', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const data = customerSchema.parse(req.body)
    const [customer] = await db.insert(customers).values({
      ...data, 
      userId: authReq.userId!,
      creditLimit: data.creditLimit.toString(),
      customDiscountPercent: data.customDiscountPercent.toString(),
    }).returning()
    created(res, customer)
  } catch (e) { next(e) }
})

router.put('/:id', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const data = customerSchema.partial().parse(req.body)
    const [updated] = await db.update(customers)
      .set({ 
        ...data, 
        creditLimit: data.creditLimit?.toString(),
        customDiscountPercent: data.customDiscountPercent?.toString(),
        updatedAt: new Date() 
      })
      .where(and(eq(customers.id, req.params.id), eq(customers.userId, authReq.userId!)))
      .returning()
    ok(res, updated)
  } catch (e) { next(e) }
})

export default router
