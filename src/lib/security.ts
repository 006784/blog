import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// 安全配置
const SECURITY_CONFIG = {
  // 速率限制配置
  rateLimits: {
    // API请求限制 - 每分钟最多60次
    api: {
      points: 60,
      duration: 60,
    },
    // 严格的API限制 - 每分钟最多10次（用于敏感操作）
    strict: {
      points: 10,
      duration: 60,
    },
    // 文件上传限制 - 每小时最多20次
    upload: {
      points: 20,
      duration: 3600,
    }
  },
  
  // 输入验证配置
  inputValidation: {
    maxStringLength: 10000, // 最大字符串长度
    maxArrayLength: 100,    // 最大数组长度
    allowedProtocols: ['http:', 'https:'],
  },
  
  // 安全头配置
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  }
};

// 创建速率限制器实例
const rateLimiters = {
  api: new RateLimiterMemory({
    keyPrefix: 'api',
    points: SECURITY_CONFIG.rateLimits.api.points,
    duration: SECURITY_CONFIG.rateLimits.api.duration,
  }),
  strict: new RateLimiterMemory({
    keyPrefix: 'strict',
    points: SECURITY_CONFIG.rateLimits.strict.points,
    duration: SECURITY_CONFIG.rateLimits.strict.duration,
  }),
  upload: new RateLimiterMemory({
    keyPrefix: 'upload',
    points: SECURITY_CONFIG.rateLimits.upload.points,
    duration: SECURITY_CONFIG.rateLimits.upload.duration,
  })
};

// 获取客户端IP
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  ).split(',')[0].trim();
}

// 生成速率限制键
function getRateLimitKey(request: NextRequest, type: string): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  return `${type}:${ip}:${userAgent.substring(0, 50)}`;
}

// 应用安全头
function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_CONFIG.securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  return response;
}

// 输入验证和清理
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // 移除潜在危险字符
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
      .replace(/javascript:/gi, '') // 移除javascript协议
      .replace(/data:/gi, '') // 移除data协议
      .replace(/vbscript:/gi, '') // 移除vbscript协议
      .trim();
    
    // 限制长度
    if (sanitized.length > SECURITY_CONFIG.inputValidation.maxStringLength) {
      sanitized = sanitized.substring(0, SECURITY_CONFIG.inputValidation.maxStringLength);
    }
    
    return sanitized;
  }
  
  if (Array.isArray(input)) {
    if (input.length > SECURITY_CONFIG.inputValidation.maxArrayLength) {
      input = input.slice(0, SECURITY_CONFIG.inputValidation.maxArrayLength);
    }
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, any> = {};
    Object.keys(input).forEach(key => {
      sanitized[key] = sanitizeInput(input[key]);
    });
    return sanitized;
  }
  
  return input;
}

// 验证URL安全性
export function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return SECURITY_CONFIG.inputValidation.allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

// 速率限制中间件
export async function rateLimitMiddleware(
  request: NextRequest, 
  type: 'api' | 'strict' | 'upload' = 'api'
): Promise<NextResponse | null> {
  try {
    const key = getRateLimitKey(request, type);
    const limiter = rateLimiters[type];
    
    try {
      await limiter.consume(key, 1);
      return null; // 允许通过
    } catch (rateLimiterRes: any) {
      const retrySecs = rateLimiterRes?.msBeforeNext ? rateLimiterRes.msBeforeNext / 1000 : 60;
      
      return NextResponse.json(
        { 
          success: false, 
          error: '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil(retrySecs)
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': retrySecs.toString()
          }
        }
      );
    }
  } catch (error) {
    console.error('速率限制检查失败:', error);
    // 发生错误时允许通过，避免影响正常服务
    return null;
  }
}

// CSRF保护（基于自定义头部验证）
export function csrfProtection(request: NextRequest): boolean {
  // 对于GET请求不需要CSRF检查
  if (request.method === 'GET') {
    return true;
  }
  
  // 检查自定义CSRF头部
  const csrfHeader = request.headers.get('x-csrf-token');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // 验证来源
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter(Boolean);
  
  const requestOrigin = origin || (referer ? new URL(referer).origin : null);
  
  if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    return false;
  }
  
  // 对于敏感操作需要CSRF令牌
  const sensitivePaths = ['/api/upload', '/api/resources', '/api/categories'];
  const isSensitive = sensitivePaths.some(path => request.url.includes(path));
  
  if (isSensitive && !csrfHeader) {
    return false;
  }
  
  return true;
}

// 内容安全策略
export function getContentSecurityPolicy(): string {
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.sentry.io;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://*.sentry.io https://*.supabase.co;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim();
}

// 安全响应包装器
export function createSecureResponse(
  data: any, 
  options?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const response = NextResponse.json(data, { status: options?.status });
  
  // 应用安全头
  applySecurityHeaders(response);
  
  // 添加CSP
  response.headers.set('Content-Security-Policy', getContentSecurityPolicy());
  
  // 添加自定义头部
  if (options?.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

// 输入验证装饰器
export function validateInput(validationRules: Record<string, (value: any) => boolean | string>) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const [requestData] = args;
      
      // 验证输入数据
      for (const [field, validator] of Object.entries(validationRules)) {
        const value = requestData[field];
        const result = validator(value);
        
        if (result !== true) {
          throw new Error(
            typeof result === 'string' 
              ? result 
              : `字段 "${field}" 验证失败`
          );
        }
      }
      
      // 清理输入数据
      const sanitizedData = sanitizeInput(requestData);
      
      return originalMethod.call(this, sanitizedData, ...args.slice(1));
    };
    
    return descriptor;
  };
}

export { SECURITY_CONFIG };