import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import Joi from 'joi';

import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { firestore } from '../lib/firebaseAdmin.js';
import { getPersonaByOwner } from '../services/personaService.js';
import { processChat, appendSystemMessage, ensureGuidanceLevel } from '../services/chatService.js';
import { setTimerIfNeeded, computeRemainingMs } from '../services/timerService.js';

const router = Router();
const messagesSchema = Joi.object({
  text: Joi.string().max(1000).required(),
  clientMessageId: Joi.string().uuid().required()
});

router.get('/:personaId/chat', async (req: AuthenticatedRequest, res, next) => {
  try {
    const persona = await getPersonaByOwner(req.user!.uid);
    if (!persona || persona.id !== req.params.personaId) {
      return res.status(404).json({ error: { code: 'persona_not_found', message: 'Persona not found' } });
    }

    const snapshot = await firestore()
      .collection('conversations')
      .doc(persona.id)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(Number(req.query.limit ?? 25))
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString() ?? new Date().toISOString()
    }));

    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
});

router.post('/:personaId/chat', rateLimit, async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = await messagesSchema.validateAsync(req.body, { abortEarly: false });
    const persona = await getPersonaByOwner(req.user!.uid);
    if (!persona || persona.id !== req.params.personaId) {
      return res.status(404).json({ error: { code: 'persona_not_found', message: 'Persona not found' } });
    }

    if (persona.status === 'expired') {
      return res.status(410).json({ error: { code: 'persona_expired', message: 'This persona has reached the end of its session.' } });
    }

    await setTimerIfNeeded(persona.id);

    const aiResponse = await processChat(persona, payload.text);
    const refreshedGuidance = await ensureGuidanceLevel(persona.id, persona.expiresAt);
    if (refreshedGuidance !== persona.guidanceLevel) {
      await firestore().collection('personas').doc(persona.id).update({ guidanceLevel: refreshedGuidance });
      if (refreshedGuidance >= 2) {
        await appendSystemMessage(persona.id, 'Guided closure reminder: take a moment to reflect on a cherished memory together.');
      }
    }

    const messages = [
      {
        id: payload.clientMessageId,
        sender: 'user' as const,
        text: payload.text,
        timestamp: new Date().toISOString()
      },
      {
        id: randomUUID(),
        sender: 'ai' as const,
        text: aiResponse.aiMessage,
        timestamp: new Date().toISOString(),
        meta: {
          llmTokens: aiResponse.usage?.total_tokens
        }
      }
    ];

    const remainingMs = computeRemainingMs(persona.expiresAt ?? null);

    return res.json({
      personaStatus: persona.status,
      remainingMs,
      messages,
      summaryAppended: false
    });
  } catch (error) {
    return next(error);
  }
});

export { router as chatRouter };

