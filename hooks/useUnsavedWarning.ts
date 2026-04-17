import { useEffect } from 'react';

export function useUnsavedWarning(hasUnsavedData: boolean) {
  useEffect(() => {
    if (!hasUnsavedData) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedData]);
}
