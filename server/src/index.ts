import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import dotenv from 'dotenv'
dotenv.config()

import { errorHandler } from './middleware/errorHandler'
import productsRouter from './routes/products'
import customersRouter from './routes/customers'
import salesRouter from './routes/sales'
import paymentsRouter from './routes/payments'
import batchesRouter from './routes/batches'
import reportsRouter from './routes/reports'
import aiRouter from './routes/ai'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({ 
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : '*', 
  credentials: true 
}))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }))
app.use(compression())
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Keep-Alive', 'timeout=30')
  next()
})

import { requestLogger } from './middleware/logger'
app.use(requestLogger)

app.use('/api/products', productsRouter)
app.use('/api/customers', customersRouter)
app.use('/api/sales', salesRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/batches', batchesRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/ai', aiRouter)

import healthRouter from './routes/health'
app.use('/api/health', healthRouter)

import { notFoundHandler } from './middleware/notFound'
app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(PORT, () => console.log(`Mera Vyapaar server running on port ${PORT}`))
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => { console.log('Server closed'); process.exit(0) })
  setTimeout(() => process.exit(1), 10000)
})
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})
