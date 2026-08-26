import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET)
const EXPIRATION = "24h"

export interface TokenPayload {
  userId: string
  email: string
  role: string
  name: string
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}
