// Session-expiry signal shared between the HTTP layer (which detects a 401) and the UI
// (which clears cached data and shows the expired screen). It fires once per session, so
// a burst of parallel 401s can't trigger repeated redirects or a retry loop.

type Listener = () => void;

const listeners = new Set<Listener>();
let expired = false;

export function onSessionExpired(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifySessionExpired() {
  if (expired) return;
  expired = true;
  listeners.forEach((listener) => listener());
}

export function isSessionExpired() {
  return expired;
}

/** Call after the user signs in again. */
export function resetSession() {
  expired = false;
}
