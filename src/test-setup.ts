import { TestBed } from '@angular/core/testing';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import * as LucideIcons from './app/shared/icons/lucide-icons';

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

// Lucide icons are provided globally in app.config.ts but not in TestBed.
// This patch injects the icon provider into every configureTestingModule call
// so specs don't need to add it manually.
const _origConfigure = TestBed.configureTestingModule;
TestBed.configureTestingModule = function (config) {
  return _origConfigure.call(TestBed, {
    ...config,
    providers: [
      { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(LucideIcons) },
      ...(config.providers ?? []),
    ],
  });
};
