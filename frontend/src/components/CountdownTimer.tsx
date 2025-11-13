import { useEffect, useMemo, useState } from 'react';

type PersonaStatus = 'active' | 'expired' | 'deleted' | 'pending';

interface CountdownTimerProps {
  expiresAt: string | null;
  status: PersonaStatus;
}

export const CountdownTimer = ({ expiresAt, status }: CountdownTimerProps) => {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt || status !== 'active') {
      setRemainingMs(null);
      return;
    }

    const expiresDate = new Date(expiresAt).getTime();
    const update = () => setRemainingMs(Math.max(0, expiresDate - Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, status]);

  const countdownText = useMemo(() => {
    if (status === 'expired') {
      return 'Session expired';
    }
    if (!remainingMs) {
      return 'Timer will start after your first conversation.';
    }
    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m remaining`;
  }, [remainingMs, status]);

  return (
    <div aria-live="polite" className="timer">
      <strong>Time Remaining:</strong> {countdownText}
    </div>
  );
};

