import { Router } from 'express';
import Joi from 'joi';

import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createPersona, deletePersonaCascade, getPersonaByOwner, updatePersona } from '../services/personaService.js';
import admin from 'firebase-admin';

import { setTimerIfNeeded, computeRemainingMs } from '../services/timerService.js';
import { firestore } from '../lib/firebaseAdmin.js';

const router = Router();

const personaSchema = Joi.object({
  name: Joi.string().max(120).required(),
  relationship: Joi.string().max(120).required(),
  traits: Joi.array().items(Joi.string()).max(8).required(),
  keyMemories: Joi.array().items(Joi.string()).max(10).required(),
  commonPhrases: Joi.array().items(Joi.string()).max(10).required(),
  voiceSampleUrl: Joi.string().uri().optional()
});

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const persona = await getPersonaByOwner(req.user!.uid);
    if (!persona) {
      return res.status(200).json(null);
    }
    const remainingMs = computeRemainingMs(persona.expiresAt ?? null);
    return res.json({
      id: persona.id,
      name: persona.name,
      relationship: persona.relationship,
      status: persona.status,
      expiresAt: persona.expiresAt?.toDate().toISOString() ?? null,
      remainingMs
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = await personaSchema.validateAsync(req.body, { abortEarly: false });
    const personaId = await createPersona(req.user!.uid, payload);
    return res.status(201).json({ id: personaId });
  } catch (error) {
    return next(error);
  }
});

router.put('/:personaId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = await personaSchema.validateAsync(req.body, { abortEarly: false });
    await updatePersona(req.params.personaId, req.user!.uid, payload);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post('/:personaId/start', async (req: AuthenticatedRequest, res, next) => {
  try {
    await setTimerIfNeeded(req.params.personaId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

const deleteSchema = Joi.object({
  confirmation: Joi.string().required()
});

const CONFIRMATION_SENTENCE = 'I understand this will permanently delete my persona and messages.';

router.delete('/:personaId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { confirmation } = await deleteSchema.validateAsync(req.body);
    if (confirmation !== CONFIRMATION_SENTENCE) {
      return res.status(400).json({
        error: {
          code: 'confirmation_mismatch',
          message: 'Confirmation sentence mismatch.'
        }
      });
    }
    await firestore()
      .collection('audit/deletionRequests')
      .add({
        userId: req.user!.uid,
        personaId: req.params.personaId,
        confirmationText: confirmation,
        type: 'persona',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    await deletePersonaCascade(req.params.personaId, req.user!.uid);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export { router as personaRouter };

