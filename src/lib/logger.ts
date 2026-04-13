import winston from 'winston';

// 动态导入 Sentry（仅在服务端，避免循环依赖）
let sentryIntegration: typeof import('./sentry-integration') | null = null;
if (typeof window === 'undefined') {
  import('./sentry-integration')
    .then((module) => {
      sentryIntegration = module;
    })
    .catch(() => {
      // Sentry 集成可选，初始化失败不影响主系统
    });
}

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 定义传输器
const transports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// 创建logger实例
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  defaultMeta: {
    service: 'lumen-blog',
    environment: process.env.NODE_ENV || 'development',
  },
});

// 如果不是生产环境，添加更详细的日志
if (process.env.NODE_ENV !== 'production') {
  baseLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// ——— 增强 logger 实例，支持结构化日志 ———

interface LogContext {
  [key: string]: unknown;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

type LogMeta = LogContext | Record<string, unknown>;

/**
 * 结构化日志记录器，支持链式调用设置上下文
 */
class StructuredLogger {
  private context: Record<string, unknown> = {};

  constructor(private logger: winston.Logger) {}

  /**
   * 设置日志上下文信息
   */
  setContext(context: LogMeta): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * 清除上下文
   */
  clearContext(): this {
    this.context = {};
    return this;
  }

  /**
   * 记录错误日志
   */
  error(message: string, meta?: unknown): void {
    const errorObj = typeof meta === 'object' && meta !== null ? meta : { error: meta };
    
    // 记录到 Winston
    this.logger.error(message, {
      ...this.context,
      ...errorObj,
      timestamp: new Date().toISOString(),
      level: 'error',
    });
    
    // 上报到 Sentry (可选)
    if (sentryIntegration && process.env.NODE_ENV === 'production') {
      try {
        if (meta instanceof Error) {
          sentryIntegration.captureException(meta, { message });
        } else if (typeof meta === 'object' && meta !== null) {
          sentryIntegration.captureMessage(message, 'error', meta as Record<string, unknown>);
        }
      } catch {
        // Sentry 上报失败不影响主流程
      }
    }
  }

  /**
   * 记录警告日志
   */
  warn(message: string, meta?: unknown): void {
    this.logger.warn(message, {
      ...this.context,
      ...(typeof meta === 'object' && meta !== null ? meta : { value: meta }),
      timestamp: new Date().toISOString(),
      level: 'warn',
    });
  }

  /**
   * 记录信息日志
   */
  info(message: string, meta?: unknown): void {
    this.logger.info(message, {
      ...this.context,
      ...(typeof meta === 'object' && meta !== null ? meta : { value: meta }),
      timestamp: new Date().toISOString(),
      level: 'info',
    });
  }

  /**
   * 记录调试日志
   */
  debug(message: string, meta?: unknown): void {
    this.logger.debug(message, {
      ...this.context,
      ...(typeof meta === 'object' && meta !== null ? meta : { value: meta }),
      timestamp: new Date().toISOString(),
      level: 'debug',
    });
  }

  /**
   * 记录 HTTP 请求日志
   */
  http(message: string, meta?: unknown): void {
    this.logger.log('http', message, {
      ...this.context,
      ...(typeof meta === 'object' && meta !== null ? meta : { value: meta }),
      timestamp: new Date().toISOString(),
      level: 'http',
    });
  }

  /**
   * 记录性能指标
   */
  metric(name: string, value: number, unit: string = 'ms', meta?: unknown): void {
    this.info(`性能指标: ${name}`, {
      ...(typeof meta === 'object' && meta !== null ? meta : {}),
      metric_name: name,
      metric_value: value,
      metric_unit: unit,
    });
  }

  /**
   * 记录审计日志（用于敏感操作）
   */
  audit(action: string, meta?: unknown): void {
    this.info(`审计日志: ${action}`, {
      ...(typeof meta === 'object' && meta !== null ? meta : {}),
      audit_action: action,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new StructuredLogger(baseLogger);

interface HttpReq {
  method?: string;
  url?: string;
  get?: (h: string) => string | undefined;
  ip?: string;
  connection?: { remoteAddress?: string };
}
interface HttpRes {
  statusCode?: number;
  on: (event: string, cb: () => void) => void;
}

// 创建HTTP请求日志中间件（Express 兼容）
export const httpLogger = (req: HttpReq, res: HttpRes, next: () => void) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
      module: 'http',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get?.('User-Agent'),
      ip: req.ip || req.connection?.remoteAddress,
    });
  });

  next();
};

// 创建API日志装饰器
export const logApiCall = (apiName: string) => {
  return (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      
      try {
        logger.info(`API调用开始: ${apiName}`, { 
          args: args.slice(0, 2), // 只记录前两个参数避免敏感信息
          timestamp: new Date().toISOString()
        });
        
        const result = await originalMethod.apply(this, args);
        
        const duration = Date.now() - startTime;
        logger.info(`API调用成功: ${apiName}`, { 
          duration,
          timestamp: new Date().toISOString()
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`API调用失败: ${apiName}`, { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
    
    return descriptor;
  };
};

export default logger;
