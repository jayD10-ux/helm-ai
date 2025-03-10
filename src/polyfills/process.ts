
// This file provides a minimal polyfill for the Node.js 'process' object
// when running in a browser environment

if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {},
    nextTick: (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0),
    browser: true
  };
}

export {};
