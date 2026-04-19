import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
    })
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message })
  }
  console.error('[Server Error]', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
}
