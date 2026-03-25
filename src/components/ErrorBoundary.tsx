'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 自定义降级 UI，不传则使用默认卡片 */
  fallback?: ReactNode;
  /** 出错回调，用于上报 Sentry 等 */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center rounded-2xl border border-border bg-card">
          <p className="text-4xl">⚠️</p>
          <p className="font-semibold text-foreground">组件加载出错了</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {this.state.error?.message || '发生了未知错误，请稍后重试。'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
