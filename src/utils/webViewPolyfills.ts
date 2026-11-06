// older android webviews (chrome < 93) can't run the es2022 apis livekit and the frontend use
const polyfill = (target: object, name: string, value: unknown) => {
  if (name in target) return;
  Object.defineProperty(target, name, {
    value,
    writable: true,
    configurable: true,
  });
};

polyfill(Object, 'hasOwn', (object: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(object, key),
);

polyfill(Array.prototype, 'at', function at(this: unknown[], index: number) {
  const i = Math.trunc(index) || 0;
  return this[i < 0 ? i + this.length : i];
});

if (typeof crypto !== 'undefined') {
  polyfill(crypto, 'randomUUID', () =>
    '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (
        Number(c) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
      ).toString(16),
    ),
  );
}
