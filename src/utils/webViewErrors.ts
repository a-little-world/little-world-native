import * as Sentry from '@sentry/react-native';
import type { WebViewMessageEvent } from 'react-native-webview';

const WEBVIEW_ERROR = 'lw_webview_error';
const WEBVIEW_INJECT = 'lw_webview_inject';

// runs before the bundle so parse/boot errors are caught too;
// an in-page error reporter can take over via window.__lwStopErrorForwarding()
export const webViewErrorScript = `(function () {
  // android injects asynchronously: metro's __r means the bundle already ran without this script
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: '${WEBVIEW_INJECT}',
    data: {
      late: typeof window.__r === 'function',
      mounted: !!(document.getElementById('root') || {}).childElementCount,
      userAgent: navigator.userAgent,
    },
  }));
  var remaining = 20; // render loops would flood sentry
  function send(error, fallbackMessage, location) {
    if (remaining-- <= 0) return;
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: '${WEBVIEW_ERROR}',
      data: {
        name: (error && error.name) || 'Error',
        message: (error && error.message) || String(fallbackMessage || error),
        stack: error && error.stack,
        location: location,
        userAgent: navigator.userAgent,
      },
    }));
  }
  function onError(event) {
    var target = event.target;
    // failed <script>/<link> loads don't bubble, hence the capture listener
    if (target && target !== window) {
      send(null, 'Failed to load ' + (target.src || target.href || target.tagName));
      return;
    }
    send(event.error, event.message, event.filename && event.filename + ':' + event.lineno + ':' + event.colno);
  }
  function onRejection(event) { send(event.reason); }
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);
  window.__lwStopErrorForwarding = function () {
    window.removeEventListener('error', onError, true);
    window.removeEventListener('unhandledrejection', onRejection);
  };
})();
true;`;

const chromeVersion = (userAgent?: string) =>
  userAgent?.match(/Chrome\/(\d+)/)?.[1];

export function handleWebViewErrorMessage(event: WebViewMessageEvent) {
  let message: { type?: string; data?: Record<string, string | undefined> };
  try {
    message = JSON.parse(event.nativeEvent.data);
  } catch {
    return;
  }
  if (message.type === WEBVIEW_INJECT) {
    const {
      late = false,
      mounted = false,
      userAgent,
    } = (message.data as
      | { late?: boolean; mounted?: boolean; userAgent?: string }
      | undefined) ?? {};
    (late ? console.warn : console.log)(
      `WebView injected script late: ${late}, react mounted: ${mounted}`,
    );
    Sentry.setTag('webview.injectLate', late);
    Sentry.setTag('webview.mountedAtInject', mounted);
    Sentry.setTag('webview.chrome', chromeVersion(userAgent));
    Sentry.setContext('webview', { userAgent });
    return;
  }
  if (message.type !== WEBVIEW_ERROR || !message.data) return;

  const {
    name,
    message: errorMessage,
    stack,
    location,
    userAgent,
  } = message.data;
  const error = new Error(errorMessage);
  error.name = name ?? 'Error';
  // parse errors carry no stack, only the location
  error.stack =
    stack || (location && `${error.name}: ${errorMessage}\n    at ${location}`);
  Sentry.captureException(error, {
    tags: {
      source: 'webview',
      'webview.chrome': chromeVersion(userAgent),
    },
    contexts: { webview: { userAgent } },
  });
}
