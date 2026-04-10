import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "study-assistant-secret-key";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, SECRET) as { userId: number };
    return payload;
  } catch {
    return null;
  }
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
