import type { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'rl',
  points: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 12),
  duration: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000) / 1000
});

export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip ?? 'global';
    await rateLimiter.consume(key);
    return next();
  } catch (error) {
    return res.status(429).json({
      error: {
        code: 'rate_limited',
        message: 'Too many requests. Please slow down.'
      }
    });
  }
};

