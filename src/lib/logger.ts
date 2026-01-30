import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// 创建日志目录
const logDir = 'logs';

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
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // 错误日志文件 - 按天轮转
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format,
    maxFiles: '14d', // 保留14天
  }),
  
  // 所有日志文件 - 按天轮转
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format,
    maxFiles: '30d', // 保留30天
  }),
  
  // HTTP请求日志
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format,
    maxFiles: '7d', // 保留7天
  }),
];

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

// 如果不是生产环境，添加更详细的日志
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// 创建HTTP请求日志中间件
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    logger.http(`${req.method} ${req.url} ${statusCode} ${duration}ms`, {
      method: req.method,
      url: req.url,
      statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    });
  });
  
  next();
};

// 创建API日志装饰器
export const logApiCall = (apiName: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
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