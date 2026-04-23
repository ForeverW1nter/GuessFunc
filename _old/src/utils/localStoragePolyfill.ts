try {
  if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
    let memoryStorage: Record<string, string> = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => memoryStorage[key] || null,
        setItem: (key: string, value: string) => { memoryStorage[key] = String(value); },
        removeItem: (key: string) => { delete memoryStorage[key]; },
        clear: () => { memoryStorage = {}; },
        key: (index: number) => Object.keys(memoryStorage)[index] || null,
        get length() { return Object.keys(memoryStorage).length; }
      },
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  console.warn('Failed to polyfill or access localStorage:', e);
}

export {};
