import { router, type Href } from "expo-router";
import { useRef } from "react";

const LOCK_MS = 600;

/**
 * `push` that ignores repeat taps for a short window, so a double tap on a quick action
 * can't stack the same screen twice.
 */
export function useGuardedNavigation() {
  const lastAt = useRef(0);

  const guard = (navigate: () => void) => {
    const now = Date.now();
    if (now - lastAt.current < LOCK_MS) return;
    lastAt.current = now;
    navigate();
  };

  return {
    push: (href: Href) => guard(() => router.push(href)),
    navigate: (href: Href) => guard(() => router.navigate(href)),
  };
}
