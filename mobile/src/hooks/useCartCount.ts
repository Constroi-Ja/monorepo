import { useEffect } from 'react';
import { cartApi } from '@/api/cart';
import { useCartStore } from '@/store/cartStore';

export function useCartCount() {
  const setCount = useCartStore((s) => s.setCount);

  const syncCount = async () => {
    const { data } = await cartApi.getCart();
    if (data) {
      const total = data.reduce((acc, item) => acc + item.quantity, 0);
      setCount(total);
    }
  };

  return { syncCount };
}
