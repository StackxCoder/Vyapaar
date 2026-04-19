import { Request, Response } from 'express'
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` })
}
