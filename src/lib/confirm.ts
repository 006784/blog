export interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

// Module-level callback registered by ConfirmDialog component
let _openFn: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function _registerConfirmOpen(fn: (opts: ConfirmOptions) => Promise<boolean>) {
  _openFn = fn;
}

export function showConfirm(opts: ConfirmOptions | string): Promise<boolean> {
  const options: ConfirmOptions =
    typeof opts === 'string' ? { description: opts } : opts;

  if (_openFn) return _openFn(options);

  // Fallback: native confirm if dialog hasn't mounted yet
  return Promise.resolve(
    typeof window !== 'undefined' ? window.confirm(options.description) : false
  );
}
