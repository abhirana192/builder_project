// Suppress ResizeObserver loop completed errors
// This is a common issue with Radix UI components and is safe to ignore
// See: https://github.com/radix-ui/primitives/issues/1798

const debounce = (fn: Function, ms = 0) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const suppressResizeObserverErrors = () => {
  // Debounce ResizeObserver to prevent loop errors
  if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
    const OriginalResizeObserver = window.ResizeObserver;
    
    window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        const debouncedCallback = debounce(callback, 20);
        super(debouncedCallback);
      }
    };
  }

  // Suppress the specific error in console
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      args[0].includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // Suppress this specific error
      return;
    }
    originalError.apply(console, args);
  };
};
