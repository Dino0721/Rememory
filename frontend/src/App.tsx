import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CountdownTimer } from '@components/CountdownTimer';
import { PersonaChat } from '@components/PersonaChat';
import { useAuth } from '@context/AuthContext';
import { auth } from '@services/firebase';

const Dashboard = () => {
  const { persona, refreshPersona } = useAuth();

  useEffect(() => {
    void refreshPersona();
  }, [refreshPersona]);

  if (!persona) {
    return (
      <main className="container">
        <h1>Create Your Persona</h1>
        <p>You have not created a persona yet. Please complete the onboarding flow.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <h1>{persona.name}</h1>
        <span className="badge">{persona.relationship}</span>
        <CountdownTimer expiresAt={persona.expiresAt ?? null} status={persona.status} />
      </header>
      <PersonaChat persona={persona} />
    </main>
  );
};

export const App = () => {
  const { user, setUser } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route path="/login" element={<div>TODO: Implement login screen</div>} />
      </Routes>
    </BrowserRouter>
  );
};

