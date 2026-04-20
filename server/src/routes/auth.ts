import { Router } from 'express'
import { db } from '../db'
import { users, settings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, verifyPassword, signToken } from '../lib/auth'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { ok, created } from '../lib/response'
import { AppError } from '../middleware/errorHandler'

const router = Router()

const signupSchema = z.object({
  email: z.string().email('Valid email daalo'),
  password: z.string().min(6, 'Password kam se kam 6 characters ka hona chahiye'),
  companyName: z.string().min(1, 'Company naam zaroori hai'),
  ownerName: z.string().min(1, 'Aapka naam zaroori hai'),
  phone: z.string().default(''),
  city: z.string().default(''),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body)
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing.length > 0) throw new AppError(409, 'Yeh email already registered hai')

    const passwordHash = await hashPassword(data.password)
    const [user] = await db.insert(users).values({
      ...data, passwordHash,
    }).returning()

    // Auto-create settings for new user
    await db.insert(settings).values({
      userId: user.id,
      companyName: data.companyName,
      phone: data.phone,
    })

    const token = signToken(user.id, user.email)
    created(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        ownerName: user.ownerName,
        onboardingComplete: false,
      }
    }, 'Account ban gaya!')
  } catch (e) { next(e) }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) throw new AppError(401, 'Email ya password galat hai')

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) throw new AppError(401, 'Email ya password galat hai')
    if (!user.isActive) throw new AppError(403, 'Account band hai')

    const token = signToken(user.id, user.email)
    ok(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        ownerName: user.ownerName,
        onboardingComplete: user.onboardingComplete,
      }
    })
  } catch (e) { next(e) }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    const [user] = await db.select().from(users)
      .where(eq(users.id, authReq.userId!)).limit(1)
    if (!user) throw new AppError(404, 'User not found')
    ok(res, {
      id: user.id, email: user.email,
      companyName: user.companyName, ownerName: user.ownerName,
      onboardingComplete: user.onboardingComplete,
    })
  } catch (e) { next(e) }
})

// PATCH /api/auth/onboarding-complete
router.patch('/onboarding-complete', authenticate, async (req, res, next) => {
  const authReq = req as AuthRequest
  try {
    await db.update(users)
      .set({ onboardingComplete: true })
      .where(eq(users.id, authReq.userId!))
    ok(res, null, 'Onboarding complete')
  } catch (e) { next(e) }
})

export default router
