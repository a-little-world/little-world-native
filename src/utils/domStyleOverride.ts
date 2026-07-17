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
