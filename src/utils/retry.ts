import { delay } from './delay';

export const RETRY_DELAY_MS = 30_000;
export const MAX_RETRIES = 5;

export async function retry<T>(
  fn: () => Promise<T>,
  signal: AbortSignal,
  delayMs = RETRY_DELAY_MS,
): Promise<T> {
  const attempt = async (currentAttempt: number): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (currentAttempt >= MAX_RETRIES || signal.aborted) {
        throw error;
      }
      await delay(delayMs);
      if (signal.aborted) {
        throw error;
      }
      return attempt(currentAttempt + 1);
    }
  };
  return attempt(0);
}
