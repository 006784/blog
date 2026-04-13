/**
 * Sentry 错误追踪集成
 * 自动将日志和错误发送到 Sentry
 */
import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

// ——— Sentry 初始化配置 ———

/**
 * 初始化 Sentry，配置错误采样和性能监控
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    logger.warn('Sentry DSN 未配置，错误追踪功能将禁用');
    return;
  }

  Sentry.init({
    dsn,
    
    // 环境配置
    environment: process.env.NODE_ENV || 'development',
    
    // 性能监控采样率（生产环境建议 0.1-0.5）
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // 性能监控采样器（可以为不同操作设置不同采样率）
    tracesSampler: (context) => {
      // 某些请求不需要采样
      if (context.op?.startsWith('http.client')) {
        return 0.1; // 10% 采样比例
      }
      return 1.0; // 其他路由 100% 采样
    },
    
    // 日志集成
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    
    // 启用 PII 发送（但需要在生产环境中小心）
    sendDefaultPii: process.env.NODE_ENV !== 'production',
    
    // 允许 URL 列表
    allowUrls: [
      /^https?:\/\/.*artchain\.icu/,
      /^https?:\/\/localhost/,
    ],
    
    // 忽略某些错误
    ignoreErrors: [
      // 浏览器扩展
      /top\.GLOBALS/,
      // 跨域脚本加载
      /originalCreateNotification/,
      /canvas\.contentDocument/,
      /MyApp_RemoveAllHighlights/,
      // 第三方库错误
      /graph\.instagram\.com/,
      /connect\.facebook\.net/,
      // Chrome 扩展
      /extensions\//,
      /^Non-Error promise rejection captured/,
    ],
  });
  
  logger.info('Sentry 已初始化', { dsn: dsn?.split('@')[1] });
}

// ——— Sentry 工具函数 ———

/**
 * 捕获异常并上报到 Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    tags: {
      source: 'api',
    },
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
  
  // 使用对应的 logger 方法来记录消息
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

/**
 * 设置用户上下文（用于错误追踪）
 */
export function setUserContext(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * 清除用户上下文（在退出登录时调用）
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * 添加面包屑（用于追踪事件序列）
 */
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

/**
 * 开始一个性能追踪
 */
export function startPerformanceTracing(
  operationName: string
): { finish: (status?: string) => void } {
  const transaction = Sentry.startTransaction({
    op: 'operation',
    name: operationName,
  });

  return {
    finish: (status?: string) => {
      transaction.setStatus((status as Sentry.SpanStatusType) || 'ok');
      transaction.finish();
      
      if (status === 'ok') {
        logger.metric(operationName, (transaction.endTimestamp ?? 0) - transaction.startTimestamp, 'ms');
      }
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
      captureException(error instanceof Error ? error : new Error(String(error)), {
        operation: operationName,
      });
      throw error;
    }
  }) as T;
}

// ——— Sentry 中间件 ———

/**
 * Sentry 工具初始化器（在应用启动时调用）
 */
if (typeof window === 'undefined') {
  // 服务端环境
  initSentry();
}
