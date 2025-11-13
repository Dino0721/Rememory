import type { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  const status = err.status ?? 500;
  return res.status(status).json({
    error: {
      code: err.code ?? 'internal_error',
      message: err.message ?? 'An unexpected error occurred'
    }
  });
};

