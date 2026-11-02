import * as Sentry from '@sentry/react-native';
import type { WebViewMessageEvent } from 'react-native-webview';

const WEBVIEW_ERROR = 'lw_webview_error';

// runs before the bundle so parse/boot errors are caught too;
// an in-page error reporter can take over via window.__lwStopErrorForwarding()
export const webViewErrorScript = `(function () {
  function send(error, fallbackMessage) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: '${WEBVIEW_ERROR}',
      data: {
        name: (error && error.name) || 'Error',
        message: (error && error.message) || String(fallbackMessage || error),
        stack: error && error.stack,
      },
    }));
  }
  function onError(event) { send(event.error, event.message); }
  function onRejection(event) { send(event.reason); }
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  window.__lwStopErrorForwarding = function () {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
})();
true;`;

export function handleWebViewErrorMessage(event: WebViewMessageEvent) {
  let message: { type?: string; data?: Record<string, string | undefined> };
  try {
    message = JSON.parse(event.nativeEvent.data);
  } catch {
    return;
  }
  if (message.type !== WEBVIEW_ERROR || !message.data) return;

  const { name, message: errorMessage, stack } = message.data;
  const error = new Error(errorMessage);
  error.name = name ?? 'Error';
  if (stack) error.stack = stack;
  Sentry.captureException(error, { tags: { source: 'webview' } });
}
