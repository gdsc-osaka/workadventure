import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { ADMIN_API_TOKEN } from "./env.js";
import { buildErrorPayload } from "./errors.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(403).json(buildErrorPayload("FORBIDDEN", "Forbidden", "Missing Authorization header"));
    return;
  }
  let token = authHeader;
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }
  
  const expectedToken = Buffer.from(ADMIN_API_TOKEN);
  const actualToken = Buffer.from(token);
  
  if (expectedToken.length !== actualToken.length || !crypto.timingSafeEqual(expectedToken, actualToken)) {
    res.status(403).json(buildErrorPayload("FORBIDDEN", "Forbidden", "Invalid token"));
    return;
  }
  next();
}
