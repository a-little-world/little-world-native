export const DOM_OVERRIDE_CSS = `
  #root {
    display: block !important;
    height: 100% !important;
    width: 100% !important;
  }

  // Modals portal to <body>, i.e. outside the safe-area container (\`body\` padding).
  dialog[aria-label='dialog backdrop'] {
    padding-top: calc(var(--safe-top) + 16px) !important;
    padding-bottom: calc(var(--safe-bottom) + 16px) !important;
  }
  dialog[aria-label='dialog backdrop'] > button {
    top: calc(var(--safe-top) + 12px) !important;
    right: calc(var(--safe-right) + 12px) !important;
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
