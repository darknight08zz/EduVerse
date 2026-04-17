import { useState, useEffect, useCallback } from 'react';

export function useFormPersist<T extends object>(
  key: string,
  initialState: T
): [T, (updates: Partial<T>) => void, () => void, boolean] {
  const [state, setState] = useState<T>(initialState);
  const [wasRestored, setWasRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`eduverse_form_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if saved within last 2 hours (7200000 ms)
        if (parsed._savedAt && Date.now() - parsed._savedAt < 7200000) {
          const { _savedAt, ...data } = parsed;
          setState(prev => ({ ...prev, ...data }));
          setWasRestored(true);
        }
      }
    } catch (err) {
      console.error("Failed to restore form state:", err);
    }
  }, [key]);

  const update = useCallback((updates: Partial<T>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      sessionStorage.setItem(
        `eduverse_form_${key}`,
        JSON.stringify({ ...next, _savedAt: Date.now() })
      );
      return next;
    });
  }, [key]);

  const clear = useCallback(() => {
    sessionStorage.removeItem(`eduverse_form_${key}`);
    setState(initialState);
    setWasRestored(false);
  }, [key, initialState]);

  return [state, update, clear, wasRestored];
}
