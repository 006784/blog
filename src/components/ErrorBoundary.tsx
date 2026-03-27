'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { StatePanel } from '@/components/ui/StatePanel';

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
        <StatePanel
          tone="error"
          title="组件加载出错了"
          description={this.state.error?.message || '发生了未知错误，请稍后重试。'}
          action={
            <Button variant="secondary" onClick={this.handleReset}>
              重试
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
