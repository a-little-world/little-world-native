export function injectLivekitStyles(css: string, version: number) {
  if (typeof document === 'undefined') return;

  let el = document.getElementById('livekit-styles');
  if (!el) {
    el = document.createElement('style');
    el.id = 'livekit-styles';
    document.head.appendChild(el);
  }
  if (Number(el.dataset.version) > version) return;

  el.textContent = css;
  el.dataset.version = String(version);
}
