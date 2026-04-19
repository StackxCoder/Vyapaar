import { Router } from 'express'
import { db } from '../db'
import { customers, sales, payments } from '../db/schema'
import { eq, sql, desc, and } from 'drizzle-orm'
import { z } from 'zod'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'

const router = Router()

// CRITICAL: Udhaar calculated in SQL — never stored statically
const getUdhaarSQL = (customerId: string) => sql`
  COALESCE((
    SELECT SUM(credit_amount::numeric)
    FROM sales 
    WHERE customer_id = ${customerId}
  ), 0) - COALESCE((
    SELECT SUM(amount::numeric)
    FROM payments
    WHERE customer_id = ${customerId}
  ), 0)
`

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

router.get('/', async (req, res, next) => {
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
      .where(eq(customers.isActive, true))
      .orderBy(desc(customers.createdAt))
    ok(res, result)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
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
      .where(eq(customers.id, req.params.id))
    
    if (!customer) throw new AppError(404, 'Customer not found')
    ok(res, customer)
  } catch (e) { next(e) }
})

router.get('/:id/ledger', async (req, res, next) => {
  try {
    const salesData = await db.select().from(sales)
      .where(eq(sales.customerId, req.params.id))
      .orderBy(desc(sales.date))
    const paymentsData = await db.select().from(payments)
      .where(eq(payments.customerId, req.params.id))
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

router.post('/', async (req, res, next) => {
  try {
    const data = customerSchema.parse(req.body)
    const [customer] = await db.insert(customers).values({
      ...data, creditLimit: data.creditLimit.toString(),
      customDiscountPercent: data.customDiscountPercent.toString(),
    }).returning()
    created(res, customer)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = customerSchema.partial().parse(req.body)
    const [updated] = await db.update(customers)
      .set({ 
        ...data, 
        creditLimit: data.creditLimit?.toString(),
        customDiscountPercent: data.customDiscountPercent?.toString(),
        updatedAt: new Date() 
      })
      .where(eq(customers.id, req.params.id)).returning()
    ok(res, updated)
  } catch (e) { next(e) }
})

export default router
