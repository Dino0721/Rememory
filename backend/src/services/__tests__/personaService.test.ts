import { jest } from '@jest/globals';

jest.unstable_mockModule('../../lib/firebaseAdmin.js', () => ({
  firestore: () => ({
    collection: () => ({
      where: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true })
          })
        })
      }),
      add: async () => ({ id: 'persona-new' })
    }),
    app: {
      firestore: {
        FieldValue: {
          serverTimestamp: () => 'server-timestamp'
        }
      }
    }
  })
}));

const { createPersona } = await import('../personaService.js');

describe('createPersona', () => {
  it('creates persona when none exists', async () => {
    const id = await createPersona('user-1', {
      name: 'Alex',
      relationship: 'Sibling',
      traits: ['kind'],
      keyMemories: ['Beach'],
      commonPhrases: ['Hey champ']
    } as any);
    expect(id).toBe('persona-new');
  });
});

