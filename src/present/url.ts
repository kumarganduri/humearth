// Write a new query string without adding history entries. Browsers rate-limit replaceState (Safari: about
// 100 calls in 30 s), so callers write only when a choice settles; a refusal is harmless (the link just
// stays as it was).
export function replaceSearch(search: string): void {
  if (location.search === search || (!search && !location.search)) return;
  try {
    history.replaceState(history.state, '', `${location.pathname}${search}${location.hash}`);
  } catch {
    /* rate-limited or blocked: keep the current URL */
  }
}
