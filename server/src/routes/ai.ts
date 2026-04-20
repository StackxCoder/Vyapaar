import { Router } from 'express'
import { db } from '../db'
import { sales, payments, customers, products, batches, settings } from '../db/schema'
import { eq, gte, and } from 'drizzle-orm'
import { ok } from '../lib/response'
import { AppError } from '../middleware/errorHandler'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/authenticate'

const router = Router()

// Build real business context from DB
async function buildContext(userId: string) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [allSales, allPayments, allCustomers, allProducts, allBatches, settingsRow] =
    await Promise.all([
      db.select().from(sales).where(eq(sales.userId, userId)),
      db.select().from(payments).where(eq(payments.userId, userId)),
      db.select().from(customers).where(and(eq(customers.userId, userId), eq(customers.isActive, true))),
      db.select().from(products).where(and(eq(products.userId, userId), eq(products.isActive, true))),
      db.select().from(batches).where(eq(batches.userId, userId)),
      db.select().from(settings).where(eq(settings.userId, userId)).limit(1),
    ])

  const config = settingsRow[0]
  const thisMonthSales = allSales.filter(s => new Date(s.date) >= monthStart)
  const revenue = thisMonthSales.reduce((s, x) => s + Number(x.total), 0)
  const cashIn = thisMonthSales.reduce((s, x) => s + Number(x.cashReceived), 0)
  const creditGiven = thisMonthSales.reduce((s, x) => s + Number(x.creditAmount), 0)

  // Dynamic udhaar per customer
  const customerUdhaars = allCustomers.map(c => {
    const credit = allSales
      .filter(s => s.customerId === c.id)
      .reduce((s, x) => s + Number(x.creditAmount), 0)
    const paid = allPayments
      .filter(p => p.customerId === c.id)
      .reduce((s, x) => s + Number(x.amount), 0)
    const udhaar = credit - paid
    const oldest = allSales
      .filter(s => s.customerId === c.id && Number(s.creditAmount) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    const days = oldest
      ? Math.floor((today.getTime() - new Date(oldest.date).getTime()) / 86400000)
      : 0
    return { name: c.companyName, udhaar, days }
  }).filter(c => c.udhaar > 0).sort((a, b) => b.udhaar - a.udhaar)

  // Top products this month
  const productRevMap: Record<string, number> = {}
  thisMonthSales.forEach(sale => {
    const items = sale.items as any[]
    items?.forEach(item => {
      productRevMap[item.productName] = (productRevMap[item.productName] || 0) + item.amount
    })
  })
  const topProducts = Object.entries(productRevMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, rev]) => ({ name, revenue: Math.round(rev) }))

  return {
    companyName: config?.companyName || 'Mera Vyapaar',
    thisMonth: {
      revenue: Math.round(revenue),
      cashReceived: Math.round(cashIn),
      creditGiven: Math.round(creditGiven),
      salesCount: thisMonthSales.length,
    },
    totals: {
      customers: allCustomers.length,
      activeProducts: allProducts.filter(p => p.batchStatus === 'active').length,
      trialBatches: allBatches.filter(b => b.status === 'trial').length,
    },
    udhaar: {
      totalPending: Math.round(customerUdhaars.reduce((s, c) => s + c.udhaar, 0)),
      overdue60: customerUdhaars.filter(c => c.days > 60),
      topDebtors: customerUdhaars.slice(0, 5),
    },
    topProducts,
    recentSales: allSales
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(s => ({
        date: new Date(s.date).toLocaleDateString('en-IN'),
        customer: s.customerName,
        amount: Math.round(Number(s.total)),
        mode: s.saleMode,
        payment: s.paymentType,
      })),
  }
}

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).max(10).default([]),
})

router.post('/chat', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new AppError(503, 'AI service not configured on server')

    const { message, history } = chatSchema.parse(req.body)
    const ctx = await buildContext(authReq.userId!)

    const systemPrompt = `You are a smart business assistant for ${ctx.companyName}, an electrical wires and cables wholesale (B2B) business in India.

LIVE BUSINESS DATA (use these exact numbers in answers):
This month revenue: ₹${ctx.thisMonth.revenue.toLocaleString('en-IN')}
Cash received: ₹${ctx.thisMonth.cashReceived.toLocaleString('en-IN')}
Credit given: ₹${ctx.thisMonth.creditGiven.toLocaleString('en-IN')}
Sales count: ${ctx.thisMonth.salesCount}
Total customers: ${ctx.totals.customers}
Active products: ${ctx.totals.activeProducts}
Trial batches pending decision: ${ctx.totals.trialBatches}
Total udhaar pending: ₹${ctx.udhaar.totalPending.toLocaleString('en-IN')}
Customers with 60+ day udhaar: ${JSON.stringify(ctx.udhaar.overdue60)}
Top debtors: ${JSON.stringify(ctx.udhaar.topDebtors)}
Top products this month: ${JSON.stringify(ctx.topProducts)}
Recent sales: ${JSON.stringify(ctx.recentSales)}

RULES:
- Reply in Hindi if user writes Hindi, English if English, mix if they mix
- Always use real numbers from the data above — never say "I don't have data"
- For udhaar questions: name specific customers and amounts
- Keep answers under 6 lines unless asked for detail
- Be direct like a smart munshi/accountant who knows the business well
- For "kya karna chahiye" questions: give 2-3 specific actionable steps based on actual data`

    // Build conversation for Gemini
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Samjh gaya. Main is business ka assistant hoon, sab data mere paas hai. Poochho.' }] },
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.3,
            topP: 0.8,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.json() as any
      if (err.error?.code === 429) throw new AppError(429, 'AI rate limit — thoda wait karo')
      if (err.error?.code === 400) throw new AppError(400, 'AI config error — server check karo')
      throw new AppError(502, 'AI service error')
    }

    const geminiData = await geminiRes.json() as any
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) throw new AppError(502, 'AI ne koi jawab nahi diya')

    ok(res, { reply })
  } catch (e) { next(e) }
})

// Quick alert generation for dashboard
router.get('/alerts', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const ctx = await buildContext(authReq.userId!)
    const alerts: { type: string; message: string; severity: string }[] = []

    ctx.udhaar.overdue60.forEach(c => {
      alerts.push({
        type: 'udhaar',
        message: `${c.name} — ₹${Math.round(c.udhaar).toLocaleString('en-IN')} — ${c.days} din se pending`,
        severity: 'high',
      })
    })

    ok(res, alerts)
  } catch (e) { next(e) }
})

export default router
