// TODO: @simba14 and @toelle THIS IS A HACKY FIX it removes the #root.display: "flex" style which breaks the video call screen in native|
// There should be a better fix here, but I wasn't able to find where the display: flex style on the #root element is coming from so I had to forcefully overwrite it.
export const ROOT_OVERRIDE_CSS = `
  #root {
    display: block !important;
    height: 100% !important;
    width: 100% !important;
  }
`;

export function injectRootDisplayOverride(): () => void {
  const style = document.createElement('style');
  style.textContent = ROOT_OVERRIDE_CSS;
  style.setAttribute('data-root-override', 'true');
  document.head.appendChild(style);
  
  // Also apply directly to the root element if it exists
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.style.display = 'block';
    rootElement.style.height = '100%';
    rootElement.style.width = '100%';
  }
  
  return () => {
    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
  };
}

export function applyRootDisplayOverrideWithRetry(retryDelay: number = 100): () => void {
  let cleanup: (() => void) | null = null;
  
  const tryApply = () => {
    cleanup = injectRootDisplayOverride();
  };
  
  // Try immediately
  tryApply();
  
  // Retry after delay if root element wasn't found initially
  const timeoutId = setTimeout(() => {
    if (!document.getElementById('root')) {
      tryApply();
    }
  }, retryDelay);
  
  return () => {
    clearTimeout(timeoutId);
    if (cleanup) {
      cleanup();
    }
  };
}
