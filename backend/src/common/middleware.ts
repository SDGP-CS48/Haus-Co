import type { NextFunction, Request, Response } from 'express';
import { hasPermission, type Permission, type SystemRole } from '@hausco/shared';
import type { AppConfig } from './config.js';
import { verifyJwt, type AuthTokenPayload } from './crypto.js';

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export function authenticate(config: AppConfig) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Provide a valid Bearer token.' });
      return;
    }
    const token = header.slice('Bearer '.length).trim();
    const payload = verifyJwt(token, config.jwtSecret);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired authentication token.' });
      return;
    }
    req.auth = payload;
    next();
  };
}

export function optionalAuthenticate(config: AppConfig) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const payload = verifyJwt(header.slice('Bearer '.length).trim(), config.jwtSecret);
      if (payload) req.auth = payload;
    }
    next();
  };
}

export function requireRole(...roles: SystemRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({
        error: `Forbidden: Role '${req.auth.role}' is not permitted for this action.`,
      });
      return;
    }
    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!hasPermission(req.auth.role, permission)) {
      res.status(403).json({
        error: `Forbidden: Missing required permission '${permission}'.`,
      });
      return;
    }
    next();
  };
}

export function createSimpleRateLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (entry.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please wait before retrying.' });
      return;
    }
    entry.count += 1;
    next();
  };
}
