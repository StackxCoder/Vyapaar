import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/auth'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest
  const authHeader = authReq.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Login karein pehle' })
  }
  try {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    authReq.userId = payload.userId
    authReq.userEmail = payload.email
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Session expire ho gaya, dobara login karein' })
  }
}
