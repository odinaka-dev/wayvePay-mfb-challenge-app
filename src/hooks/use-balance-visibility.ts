import { useEffect, useState } from "react";

import { secureStorage } from "@/lib/storage";

const KEY = "wayve.balance-hidden";

/**
 * Hide/reveal preference for the balance. Persisted, so once hidden it stays hidden
 * across restarts until the user reveals it. Until the saved value loads we report
 * `hidden: true`, so the balance never flashes on screen.
 */
export function useBalanceVisibility() {
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    secureStorage
      .getItem(KEY)
      .then((value) => !cancelled && setHidden(value === "true"))
      .catch(() => !cancelled && setHidden(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = () => {
    const next = !(hidden ?? true);
    setHidden(next);
    secureStorage.setItem(KEY, String(next)).catch(() => {});
  };

  return { hidden: hidden ?? true, ready: hidden !== null, toggle };
}
