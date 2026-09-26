/**
 * Share one in-flight promise per key. A second caller that arrives before the
 * first finishes waits on the same work. After it settles, the next call runs again.
 */
export function dedupeInFlight<T>(
  inflight: Map<string, Promise<T>>,
  key: string,
  run: () => Promise<T>
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = run().finally(() => {
    if (inflight.get(key) === promise) {
      inflight.delete(key);
    }
  });
  inflight.set(key, promise);
  return promise;
}
