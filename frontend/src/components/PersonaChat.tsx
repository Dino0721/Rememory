import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@context/AuthContext';
import { useTTS } from '@hooks/useTTS';
import { chatWithPersona, fetchMessages } from '@services/api';

interface PersonaMetadata {
  id: string;
  name: string;
  status: 'active' | 'expired' | 'deleted';
  expiresAt?: string;
  relationship: string;
}

interface PersonaChatProps {
  persona: PersonaMetadata;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
}

export const PersonaChat = ({ persona }: PersonaChatProps) => {
  const { token } = useAuth();
  const { speak, isSpeaking, cancel } = useTTS();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    const history = await fetchMessages(persona.id, token);
    setMessages(history);
  }, [persona.id, token]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || !token || persona.status !== 'active') return;

    const text = input.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'user',
        text,
        timestamp: new Date().toISOString()
      }
    ]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithPersona(persona.id, text, token);
      setMessages((prev) => [...prev, ...response.messages]);
      const aiMessage = response.messages.find((msg) => msg.sender === 'ai');
      if (aiMessage) {
        speak(aiMessage.text);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'system',
          text: 'Something went wrong. Please try again shortly.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label={`Chat with ${persona.name}`} className="chat-card">
      <div className="chat-header">
        <h2>{persona.name}</h2>
        <p className="simulation-banner">
          This is a supportive simulation of your loved one. For urgent help, contact local emergency services or the 988 Lifeline.
        </p>
      </div>
      <div ref={messageListRef} className="chat-messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`bubble bubble-${message.sender}`}>
            <span className="bubble-sender">{message.sender === 'ai' ? persona.name : message.sender === 'user' ? 'You' : 'System'}</span>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="chat-form" aria-disabled={persona.status !== 'active'}>
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Share a memory or ask a question..."
          maxLength={1000}
          required
          disabled={persona.status !== 'active' || loading}
        />
        <div className="chat-actions">
          <button type="submit" disabled={loading || persona.status !== 'active'}>
            {loading ? 'Sending...' : 'Send'}
          </button>
          <button type="button" onClick={cancel} disabled={!isSpeaking}>
            Stop voice
          </button>
        </div>
      </form>
    </section>
  );
};

