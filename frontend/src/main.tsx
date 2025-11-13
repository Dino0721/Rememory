import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { AuthProvider } from './context/AuthContext';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

