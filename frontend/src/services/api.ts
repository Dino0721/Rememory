import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000
});

apiClient.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = {};
  }
  config.headers['Content-Type'] = 'application/json';
  return config;
});

interface PersonaResponse {
  id: string;
  name: string;
  status: 'active' | 'expired' | 'deleted';
  expiresAt?: string;
  relationship: string;
}

interface ChatResponse {
  personaStatus: 'active' | 'expired' | 'deleted';
  remainingMs: number;
  messages: Array<{
    id: string;
    sender: 'user' | 'ai' | 'system';
    text: string;
    timestamp: string;
    meta?: Record<string, unknown>;
  }>;
  summaryAppended: boolean;
}

export const fetchPersona = async (token: string): Promise<PersonaResponse | null> => {
  const response = await apiClient.get<PersonaResponse>('/persona', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data ?? null;
};

export const fetchMessages = async (personaId: string, token: string) => {
  const response = await apiClient.get<{ messages: ChatResponse['messages'] }>(`/persona/${personaId}/chat`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 25 }
  });
  return response.data.messages;
};

export const chatWithPersona = async (personaId: string, text: string, token: string): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>(
    `/persona/${personaId}/chat`,
    { text, clientMessageId: crypto.randomUUID() },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

