export const RETRY_DELAY_MS = 30_000;
export const MAX_RETRIES = 5;

export async function retry<T>(
  fn: () => Promise<T>,
  signal: AbortSignal,
  delayMs = RETRY_DELAY_MS,
): Promise<T> {
  for (let retries = 0; ; retries++) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= MAX_RETRIES || signal.aborted) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
      if (signal.aborted) {
        throw error;
      }
    }
  }
}
