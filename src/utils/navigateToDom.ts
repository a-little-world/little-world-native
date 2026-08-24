import { domCommunicationStore } from '@/src/store/domCommunicationStore';
import { useWebViewStore } from '@/src/store/webViewStore';

// A notification can be acted on long before the DOM WebView has booted - a
// cold launch from the lock screen being the obvious case - so a path that
// arrives too early is buffered and flushed once the WebView reports ready.
let pendingPath: string | null = null;

export function extractPath(data?: Record<string, unknown>): string | null {
  const path = data?.path;
  return typeof path === 'string' && path.startsWith('/') ? path : null;
}

export function openPath(path: string | null): void {
  if (!path) {
    return;
  }
  if (!useWebViewStore.getState().ready) {
    pendingPath = path;
    return;
  }

  domCommunicationStore.get().sendToDom?.({
    action: 'NAVIGATE',
    payload: { path },
  });
}

export function flushPendingPath(): void {
  if (!pendingPath) {
    return;
  }
  const path = pendingPath;
  pendingPath = null;
  openPath(path);
}
