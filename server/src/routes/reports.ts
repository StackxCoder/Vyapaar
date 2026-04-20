import { Router } from 'express'
import { db } from '../db'
import { sales, payments, products, customers } from '../db/schema'
import { sql, gte, and, eq } from 'drizzle-orm'
import { ok } from '../lib/response'
import { authenticate, AuthRequest } from '../middleware/authenticate'

const router = Router()

router.get('/pl/:year/:month', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const { year, month } = req.params
    const start = new Date(Number(year), Number(month)-1, 1)
    const end = new Date(Number(year), Number(month), 1)
    const monthSales = await db.select().from(sales)
      .where(and(eq(sales.userId, authReq.userId!), gte(sales.date, start), sql`${sales.date} < ${end}`))
    const revenue = monthSales.reduce((s, sale) => s + Number(sale.total), 0)
    const cash = monthSales.reduce((s, sale) => s + Number(sale.cashReceived), 0)
    const credit = monthSales.reduce((s, sale) => s + Number(sale.creditAmount), 0)
    const allProducts = await db.select().from(products)
      .where(eq(products.userId, authReq.userId!))
    let cogs = 0
    monthSales.forEach(sale => {
      const items = sale.items as any[]
      items.forEach(item => {
        const p = allProducts.find(p => p.id === item.productId)
        cogs += (p ? Number(p.purchasePrice) : Number(item.rate) * 0.7) * item.quantity
      })
    })
    ok(res, { revenue, cash, credit, cogs, grossProfit: revenue - cogs, salesCount: monthSales.length })
  } catch (e) { next(e) }
})

router.get('/udhaar-aging', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const allCustomers = await db.select().from(customers)
      .where(and(eq(customers.userId, authReq.userId!), eq(customers.isActive, true)))
    const allSales = await db.select().from(sales)
      .where(eq(sales.userId, authReq.userId!))
    const allPayments = await db.select().from(payments)
      .where(eq(payments.userId, authReq.userId!))
    const today = new Date()
    const result = allCustomers.map(c => {
      const creditSales = allSales.filter(s => s.customerId === c.id)
      const totalCredit = creditSales.reduce((s,sale) => s + Number(sale.creditAmount), 0)
      const totalPaid = allPayments.filter(p => p.customerId === c.id).reduce((s,p) => s + Number(p.amount), 0)
      const udhaar = totalCredit - totalPaid
      if (udhaar <= 0) return null
      let bucket0=0, bucket30=0, bucket60=0
      creditSales.forEach(sale => {
        const days = Math.floor((today.getTime() - new Date(sale.date).getTime()) / 86400000)
        const saleCredit = Number(sale.creditAmount)
        if (days <= 30) bucket0 += saleCredit
        else if (days <= 60) bucket30 += saleCredit
        else bucket60 += saleCredit
      })
      return { customer: c.companyName, phone: c.phone, udhaar, bucket0, bucket30, bucket60 }
    }).filter(Boolean)
    ok(res, result)
  } catch (e) { next(e) }
})

export default router
