'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true only after component has mounted on the client.
 * Guarantees that initial client render matches SSR render identically,
 * preventing React hydration mismatch error #418.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
