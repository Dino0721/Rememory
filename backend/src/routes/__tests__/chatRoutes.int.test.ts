import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../middleware/authMiddleware.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { uid: 'user-1', email: 'test@example.com' };
    next();
  }
}));

jest.unstable_mockModule('../../services/personaService.js', () => ({
  getPersonaByOwner: jest.fn().mockResolvedValue({
    id: 'persona-1',
    ownerId: 'user-1',
    name: 'Alex',
    relationship: 'Sibling',
    traits: ['kind'],
    keyMemories: ['Beach'],
    commonPhrases: ['Hey champ'],
    status: 'active',
    expiresAt: {
      toMillis: () => Date.now() + 1000 * 60 * 60 * 24 * 5,
      toDate: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
    },
    guidanceLevel: 0
  })
}));

jest.unstable_mockModule('../../services/chatService.js', () => ({
  processChat: jest.fn().mockResolvedValue({
    aiMessage: 'I am here for you.',
    usage: { total_tokens: 120 }
  }),
  appendSystemMessage: jest.fn(),
  ensureGuidanceLevel: jest.fn().mockResolvedValue(0)
}));

jest.unstable_mockModule('../../services/timerService.js', () => ({
  setTimerIfNeeded: jest.fn(),
  computeRemainingMs: jest.fn().mockReturnValue(1000 * 60 * 60 * 24 * 5)
}));

jest.unstable_mockModule('../../lib/firebaseAdmin.js', () => ({
  firestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy: () => ({
            limit: () => ({
              get: async () => ({ docs: [] })
            })
          })
        })
      })
    })
  })
}));

const app = (await import('../../app.js')).default;

describe('POST /api/persona/:id/chat', () => {
  it('returns AI response and remaining time', async () => {
    const response = await request(app)
      .post('/api/persona/persona-1/chat')
      .set('Authorization', 'Bearer fake-token')
      .send({ text: 'Hello', clientMessageId: '550e8400-e29b-41d4-a716-446655440000' });

    expect(response.status).toBe(200);
    expect(response.body.messages[1].text).toBe('I am here for you.');
    expect(response.body.remainingMs).toBeGreaterThan(0);
  });
});

