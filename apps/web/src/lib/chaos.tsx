import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'pph.chaos.v1';

interface ChaosContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

const ChaosContext = createContext<ChaosContextValue | null>(null);

export function ChaosProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === 'on');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    document.body.classList.toggle('chaos-active', enabled);
    document.documentElement.dataset.chaos = enabled ? 'on' : 'off';
  }, [enabled]);

  const setEnabled = (value: boolean) => setEnabledState(value);

  return <ChaosContext.Provider value={{ enabled, setEnabled }}>{children}</ChaosContext.Provider>;
}

export function useChaos(): ChaosContextValue {
  const ctx = useContext(ChaosContext);
  if (!ctx) throw new Error('useChaos must be used inside ChaosProvider');
  return ctx;
}

/**
 * Extra random latency applied to simulated loading states while Chaos Mode
 * is on. Without chaos, only `baseMs` is waited.
 */
export function chaosDelay(enabled: boolean, baseMs: number, minExtra = 800, maxExtra = 2000): Promise<void> {
  const extra = enabled ? minExtra + Math.random() * (maxExtra - minExtra) : 0;
  return new Promise((resolve) => setTimeout(resolve, baseMs + extra));
}

/**
 * Returns a key that changes on an interval while Chaos Mode is on — wrap a
 * subtree with `key={...}` to simulate the SPA re-mounting components and
 * detaching DOM nodes mid-test (a classic source of flaky tests).
 */
export function useRemountKey(intervalMs = 2500): number {
  const { enabled } = useChaos();
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setKey(0);
      return;
    }
    const id = window.setInterval(() => setKey((k) => k + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
  return enabled ? key : 0;
}
