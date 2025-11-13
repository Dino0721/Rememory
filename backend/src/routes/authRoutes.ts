import { Router } from 'express';
import Joi from 'joi';

import { auth } from '../lib/firebaseAdmin.js';

const router = Router();

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(10).required(),
  displayName: Joi.string().max(120)
});

router.post('/signup', async (req, res, next) => {
  try {
    const payload = await signupSchema.validateAsync(req.body, { abortEarly: false });
    const userRecord = await auth().createUser({
      email: payload.email,
      password: payload.password,
      displayName: payload.displayName
    });
    return res.status(201).json({ uid: userRecord.uid, email: userRecord.email });
  } catch (error) {
    return next(error);
  }
});

export { router as authRouter };

