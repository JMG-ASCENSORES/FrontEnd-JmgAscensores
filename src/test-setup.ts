// Global localStorage mock for test environment
// The Angular unit-test builder (21.0.x) runs in a jsdom environment
// where localStorage methods exist but are not functional by default.
// This mock replaces localStorage globally before any spec runs.

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => { store[key] = String(value); },
    removeItem: (key: string): void => { delete store[key]; },
    clear: (): void => { store = {}; },
    get length(): number { return Object.keys(store).length; },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
