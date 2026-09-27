/**
 * Run async work one at a time. The next call waits until the previous call
 * settles, including when that call fails.
 */
export function createExclusiveRunner(): <T>(operation: () => Promise<T>) => Promise<T> {
  let tail: Promise<void> = Promise.resolve();

  return function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation, operation);
    tail = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
}
