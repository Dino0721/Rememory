import { User, getIdToken } from 'firebase/auth';
import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { fetchPersona } from '@services/api';
import { auth } from '@services/firebase';

interface PersonaSummary {
  id: string;
  name: string;
  status: 'active' | 'expired' | 'deleted';
  expiresAt?: string;
  relationship: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  persona: PersonaSummary | null;
  setUser: (user: User | null) => void;
  refreshPersona: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [persona, setPersona] = useState<PersonaSummary | null>(null);

  const refreshPersona = useCallback(async () => {
    if (!user) {
      setPersona(null);
      setToken(null);
      return;
    }
    const freshToken = await getIdToken(user, true);
    setToken(freshToken);
    const data = await fetchPersona(freshToken);
    setPersona(data);
  }, [user]);

  const value: AuthContextValue = {
    user,
    token,
    persona,
    setUser,
    refreshPersona
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

