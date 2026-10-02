export const DOM_OVERRIDE_CSS = `
  #root {
    display: block !important;
    height: 100% !important;
    width: 100% !important;
  }
`;

// Cal renders its booking modal as a <cal-modal-box> web component; the close
// button lives inside its shadow root, where document CSS can't reach. It sits
// flush in the top-right viewport corner (under the notch), so shift it by the
// native safe-area insets. The --safe-* vars are set on <html> and inherit into
// the shadow tree.
const CAL_MODAL_SHADOW_CSS = `
  .close {
    top: var(--safe-top, 0px);
    left: calc(-20px - var(--safe-right, 0px));
  }
  /* Clamping the centered box by 2x --safe-top shifts it down by exactly
     --safe-top, so the modal no longer covers the shifted close button
     (and clears the home indicator); no-op without the vars. */
  .modal-box {
    max-height: calc(100vh - 100px - 2 * var(--safe-top, 0px)) !important;
  }
`;

/**
 * Injects safe-area CSS into every <cal-modal-box> shadow root. Cal creates the
 * element on click and reuses it afterwards, so observe body for new instances
 * and patch each one once. Returns a cleanup that removes the injected styles
 * and disconnects the observer.
 */
export function injectCalModalSafeAreaFix(): () => void {
  const patch = (box: Element) => {
    if (!box.shadowRoot || box.shadowRoot.querySelector('style[data-cal-safe-area]')) {
      return;
    }
    const style = document.createElement('style');
    style.setAttribute('data-cal-safe-area', 'true');
    style.textContent = CAL_MODAL_SHADOW_CSS;
    box.shadowRoot.appendChild(style);
  };

  const unpatch = (box: Element) => {
    box.shadowRoot
      ?.querySelectorAll('style[data-cal-safe-area]')
      .forEach(style => style.remove());
  };

  document.querySelectorAll('cal-modal-box').forEach(patch);

  const observer = new MutationObserver(() => {
    document.querySelectorAll('cal-modal-box').forEach(patch);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    document.querySelectorAll('cal-modal-box').forEach(unpatch);
  };
}

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
