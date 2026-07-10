/**
 * Neutralizes the one styling difference between the DOM-component WebView and
 * the real web app: Expo renders "use dom" components inside its own HTML shell
 * that injects react-native-web's reset — `<style id="expo-dom-component-style">`
 * in dev (@expo/cli .../middleware/DomComponentsMiddleware.js) and
 * `<style id="expo-reset">` in prod (@expo/cli/static/template/index.html) —
 * forcing `#root { display: flex; flex: 1 }`. The web app's own index.html has no
 * such rule and relies on #root being a plain full-size block (flex breaks the
 * video-call screen). Those styles live in node_modules, so we append our own
 * later-in-<head> rule to win by insertion order.
 *
 * Everything else (including link styling) now comes from the web app's bundled
 * CSS — metro.config.js only stubs `.css` for native, not the web/DOM bundle.
 */
export const DOM_OVERRIDE_CSS = `
  #root {
    display: block !important;
    height: 100% !important;
    width: 100% !important;
  }
`;

/**
 * Appends the override stylesheet to <head>. A <style> rule targets #root whenever
 * it mounts, so no retry or per-element mutation is needed. Returns a cleanup that
 * removes the injected style.
 */
export function injectDomStyleOverrides(): () => void {
  const style = document.createElement('style');
  style.textContent = DOM_OVERRIDE_CSS;
  style.setAttribute('data-dom-override', 'true');
  document.head.appendChild(style);

  return () => {
    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
  };
}
