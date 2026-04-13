/**
 * Sentry 错误追踪集成（兼容 @sentry/nextjs v10）
 * 对 Sentry 常用操作的薄封装，方便在 logger 中调用
 */
import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

// ——— 异常与消息上报 ———

/**
 * 捕获异常并上报到 Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    tags: { source: 'api' },
    extra: context,
  });

  logger.error('异常已报告到 Sentry', {
    errorMessage: error.message,
    errorName: error.name,
    ...context,
  });
}

/**
 * 捕获消息并上报到 Sentry
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, unknown>
) {
  Sentry.captureMessage(message, level);

  switch (level) {
    case 'fatal':
    case 'error':
      logger.error(message, context);
      break;
    case 'warning':
      logger.warn(message, context);
      break;
    case 'info':
      logger.info(message, context);
      break;
    case 'debug':
      logger.debug(message, context);
      break;
  }
}

// ——— 用户上下文 ———

export function setUserContext(userId: string, email?: string, username?: string) {
  Sentry.setUser({ id: userId, email, username });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

// ——— 面包屑 ———

export function addBreadcrumb(
  message: string,
  category: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// ——— 性能追踪（v10 API）———

/**
 * 开始一个手动管理生命周期的 span
 */
export function startPerformanceTracing(operationName: string): { finish: (status?: string) => void } {
  const startTime = Date.now();
  const span = Sentry.startInactiveSpan({ op: 'operation', name: operationName });

  return {
    finish: (status?: string) => {
      if (status && status !== 'ok') {
        span.setStatus({ code: 2, message: status }); // 2 = ERROR
      }
      span.end();
      logger.metric(operationName, Date.now() - startTime, 'ms');
    },
  };
}

/**
 * 包装异步函数以自动捕获错误
 */
export function withSentryCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: unknown[]) => {
    const { finish } = startPerformanceTracing(operationName);
    try {
      const result = await fn(...args);
      finish('ok');
      return result;
    } catch (error) {
      finish('error');
      captureException(
        error instanceof Error ? error : new Error(String(error)),
        { operation: operationName }
      );
      throw error;
    }
  }) as T;
}
