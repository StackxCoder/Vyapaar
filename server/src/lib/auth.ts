import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production'
const SALT_ROUNDS = 12

export const hashPassword = (pwd: string) => bcrypt.hash(pwd, SALT_ROUNDS)
export const verifyPassword = (pwd: string, hash: string) => bcrypt.compare(pwd, hash)

export function signToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { userId: string; email: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
}
