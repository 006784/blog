import * as Sentry from "@sentry/nextjs";
import { validateEnvOnStartup } from './lib/env';

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    
    // 只在生产环境严格验证环境变量
    // 开发环境允许部分缺失，只显示警告
    if (process.env.NODE_ENV === 'production') {
      try {
        validateEnvOnStartup();
      } catch (error) {
        console.error('❌ 生产环境环境变量验证失败:', error);
        // 生产环境必须中断启动
        throw error;
      }
    } else {
      // 开发环境只尝试验证，不中断启动
      try {
        validateEnvOnStartup();
      } catch (error) {
        console.warn('⚠️  开发环境变量验证警告:', error instanceof Error ? error.message : error);
      }
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
