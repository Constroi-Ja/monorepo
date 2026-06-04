import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function usePolling(
  callback: () => void,
  intervalMs: number,
  active: boolean
) {
  const callbackRef = useRef(callback);
  const activeRef = useRef(active);
  callbackRef.current = callback;
  activeRef.current = active;

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => {
      if (activeRef.current) callbackRef.current();
    }, intervalMs);

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      activeRef.current = state === 'active' && active;
    });

    return () => {
      clearInterval(id);
      appStateSub.remove();
    };
  }, [active, intervalMs]);
}
