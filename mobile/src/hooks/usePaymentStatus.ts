import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { paymentsApi } from '@/api/payments';

export function usePaymentStatus(
  paymentId: number | null,
  onApproved: () => void,
  onCancelled?: () => void
) {
  const pollingActive = useRef(true);

  useEffect(() => {
    if (!paymentId) return;

    const appStateSub = AppState.addEventListener('change', (state) => {
      pollingActive.current = state === 'active';
    });

    const interval = setInterval(async () => {
      if (!pollingActive.current) return;

      const { data } = await paymentsApi.getStatus(paymentId);
      if (!data) return;

      if (data.status === 'approved') {
        pollingActive.current = false;
        clearInterval(interval);
        onApproved();
      } else if (data.status === 'cancelled' || data.status === 'rejected') {
        pollingActive.current = false;
        clearInterval(interval);
        onCancelled?.();
      }
    }, 5000);

    return () => {
      pollingActive.current = false;
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [paymentId]);
}
