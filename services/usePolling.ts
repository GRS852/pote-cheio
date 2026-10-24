import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

function isVisible(): boolean {
  if (Platform.OS === 'web') {
    return typeof document === 'undefined' || document.visibilityState === 'visible';
  }
  return AppState.currentState === 'active';
}

/**
 * Atualização periódica de segurança: chama `callback` a cada `intervalMs`
 * enquanto `enabled` e a tela estiver visível (aba aberta / app em primeiro
 * plano). Ao voltar pra aba/app, chama na hora pra buscar o que chegou.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      if (isVisible()) callbackRef.current();
    }, intervalMs);

    let removeVisibility: () => void;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onChange = () => { if (isVisible()) callbackRef.current(); };
      document.addEventListener('visibilitychange', onChange);
      removeVisibility = () => document.removeEventListener('visibilitychange', onChange);
    } else {
      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') callbackRef.current();
      });
      removeVisibility = () => sub.remove();
    }

    return () => {
      clearInterval(timer);
      removeVisibility();
    };
  }, [intervalMs, enabled]);
}
