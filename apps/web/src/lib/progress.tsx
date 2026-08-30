import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CHALLENGE_COUNT } from '../challenges';

const STORAGE_KEY = 'pph.progress.v1';

interface ProgressState {
  done: Record<string, boolean>;
}

interface ProgressContextValue extends ProgressState {
  isDone: (id: string) => boolean;
  toggle: (id: string) => void;
  doneCount: number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressState;
  } catch {
    // corrupt storage behaves like fresh progress
  }
  return { done: {} };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.documentElement.dataset.progress = String(Object.keys(state.done).length);
  }, [state]);

  const toggle = useCallback((id: string) => {
    setState((prev) => {
      const done = { ...prev.done };
      if (done[id]) delete done[id];
      else done[id] = true;
      return { done };
    });
  }, []);

  const isDone = useCallback((id: string) => Boolean(state.done[id]), [state.done]);

  const value: ProgressContextValue = {
    done: state.done,
    isDone,
    toggle,
    doneCount: Object.keys(state.done).length,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue & { total: number } {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return { ...ctx, total: CHALLENGE_COUNT };
}
