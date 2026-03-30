'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { _registerConfirmOpen, type ConfirmOptions } from '@/lib/confirm';

interface State {
  open: boolean;
  opts: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

const DEFAULT_OPTS: ConfirmOptions = { description: '' };

export function ConfirmDialog() {
  const [state, setState] = useState<State>({ open: false, opts: DEFAULT_OPTS, resolve: null });
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const open = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, opts, resolve });
    });
  }, []);

  useEffect(() => {
    _registerConfirmOpen(open);
  }, [open]);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (state.open) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [state.open]);

  const handleResponse = (value: boolean) => {
    state.resolve?.(value);
    setState({ open: false, opts: DEFAULT_OPTS, resolve: null });
  };

  // Close on Escape
  useEffect(() => {
    if (!state.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleResponse(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open]);

  const { opts } = state;

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => handleResponse(false)}
        >
          <motion.div
            key="confirm-panel"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="w-full max-w-sm rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-2xl)] backdrop-blur-xl"
          >
            {opts.danger && (
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]">
                <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" strokeWidth={1.5} />
              </div>
            )}

            {opts.title && (
              <h2 id="confirm-title" className="mb-2 text-base font-semibold text-[var(--ink)]">
                {opts.title}
              </h2>
            )}

            <p id="confirm-desc" className="text-sm leading-relaxed text-[var(--ink-secondary)]">
              {opts.description}
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => handleResponse(false)}>
                {opts.cancelText ?? '取消'}
              </Button>
              <Button
                ref={confirmBtnRef}
                variant={opts.danger ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleResponse(true)}
              >
                {opts.confirmText ?? '确认'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
