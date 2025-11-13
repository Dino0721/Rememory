import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PersonaChat } from '../PersonaChat';

vi.mock('@context/AuthContext', () => ({
  useAuth: () => ({
    token: 'fake-token'
  })
}));

vi.mock('@services/api', () => ({
  fetchMessages: vi.fn().mockResolvedValue([]),
  chatWithPersona: vi.fn().mockResolvedValue({
    personaStatus: 'active',
    remainingMs: 1000,
    summaryAppended: false,
    messages: [
      {
        id: 'msg-ai',
        sender: 'ai',
        text: 'Hello from the simulation.',
        timestamp: new Date().toISOString()
      }
    ]
  })
}));

vi.mock('@hooks/useTTS', () => ({
  useTTS: () => ({
    speak: vi.fn(),
    cancel: vi.fn(),
    isSpeaking: false
  })
}));

describe('PersonaChat', () => {
  it('sends user message and renders AI response', async () => {
    const persona = {
      id: 'persona-1',
      name: 'Alex',
      relationship: 'Sibling',
      status: 'active' as const
    };

    render(<PersonaChat persona={persona} />);

    const textarea = await screen.findByLabelText(/message/i);
    await userEvent.type(textarea, 'Hi there');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('Hello from the simulation.')).toBeInTheDocument();
  });
});

