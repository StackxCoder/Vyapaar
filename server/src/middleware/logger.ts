import { Request, Response, NextFunction } from 'express'
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'
    if (process.env.NODE_ENV !== 'production' || ms > 2000) {
      console.log(`${color}${req.method} ${req.path} ${res.statusCode} ${ms}ms\x1b[0m`)
    }
  })
  next()
}
