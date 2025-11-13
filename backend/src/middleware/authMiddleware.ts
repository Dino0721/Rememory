import type { Request, Response, NextFunction } from 'express';

import { auth as firebaseAuth } from '../lib/firebaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing authentication token' } });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = await firebaseAuth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (error) {
    return res.status(401).json({ error: { code: 'invalid_token', message: 'Could not verify credentials' } });
  }
};

