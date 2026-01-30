import * as Sentry from "@sentry/nextjs";

// 配置静态导出
export const dynamic = 'force-static';
export const revalidate = 0;

// 注意：这个示例API在静态导出模式下不会真正抛出错误
// 因为它会被预渲染为静态文件

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  Sentry.logger.info("Sentry example API called");
  throw new SentryExampleAPIError(
    "This error is raised on the backend called by the example page.",
  );
}
