import { Router } from 'express'
import { db } from '../db'
import { settings } from '../db/schema'
import { ok } from '../lib/response'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const { prompt } = req.body
    if (!prompt) throw new AppError(400, 'Prompt is required')

    const [appSettings] = await db.select().from(settings).limit(1)
    const apiKey = appSettings?.geminiApiKey || process.env.GEMINI_API_KEY
    if (!apiKey) throw new AppError(500, 'Gemini API key not configured')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    const data = await response.json()
    if (!response.ok) throw new AppError(500, (data as any)?.error?.message || 'AI request failed')

    const answer = (data as any).candidates?.[0]?.content?.parts?.[0]?.text || ''
    ok(res, { answer })
  } catch (e) { next(e) }
})

export default router
