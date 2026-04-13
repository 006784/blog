/**
 * 增强的 API 路由处理器
 * 提供自动错误处理、日志、认证等功能
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { requireAdminSession } from './auth-server';
import { rateLimitMiddleware } from './security';

// ——— 错误码定义 ———

export const ERROR_CODES = {
  // 客户端错误 4xx
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  
  // 服务器错误 5xx
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ——— 响应类型定义 ———

export interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
  path: string;
  method: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    details?: unknown;
  };
  meta: ApiResponseMeta;
}

export type ApiHandlerResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ——— 错误类定义 ———

export class ApiError extends Error {
  constructor(
    public message: string,
    public code: ErrorCode = 'INTERNAL_ERROR',
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = '未授权访问') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = '资源不存在') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// ——— 响应生成器 ———

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createMeta(request: NextRequest): ApiResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
    path: new URL(request.url).pathname,
    method: request.method,
  };
}

export function successResponse<T>(
  data: T,
  request: NextRequest,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: createMeta(request),
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  code: ErrorCode = 'INTERNAL_ERROR',
  request: NextRequest,
  status: number = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        ...(details ? { details } : {}),
      },
      meta: createMeta(request),
    },
    { status }
  );
}

// ——— 路由处理器类型 ———

export type ApiRouteHandler<T = unknown> = (
  request: NextRequest,
  context?: { meta: ApiResponseMeta }
) => Promise<NextResponse<ApiHandlerResponse<T>>>;

export type ApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// ——— 配置选项 ———

export interface ApiHandlerOptions {
  /** 是否需要管理员认证 */
  requireAuth?: boolean;
  /** 管理员角色要求 */
  minRole?: 'editor' | 'admin' | 'super_admin';
  /** 速率限制类型 */
  rateLimit?: 'api' | 'strict' | 'upload' | false;
  /** 是否记录请求 */
  logRequest?: boolean;
  /** 是否记录响应 */
  logResponse?: boolean;
}

// ——— 主要处理器工厂函数 ———

/**
 * 创建一个经过增强的 API 路由处理器
 * 自动处理认证、速率限制、错误处理和日志
 * 
 * @example
 * export const GET = createApiHandler(
 *   async (request, context) => {
 *     const data = await fetchData();
 *     return successResponse(data, request);
 *   },
 *   { logRequest: true }
 * );
 */
export function createApiHandler(
  handler: (request: NextRequest, context: { meta: ApiResponseMeta }) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  const {
    requireAuth = false,
    minRole = 'editor',
    rateLimit = undefined,
    logRequest = true,
    logResponse = true,
  } = options;

  return async (request: NextRequest) => {
    const meta = createMeta(request);
    const method = request.method;
    const path = new URL(request.url).pathname;

    try {
      // 日志记录 - 请求开始
      if (logRequest) {
        logger.info('API 请求开始', {
          requestId: meta.requestId,
          method,
          path,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        });
      }

      // 1. 检查速率限制
      if (rateLimit) {
        const rateLimitResponse = await rateLimitMiddleware(request, rateLimit);
        if (rateLimitResponse) {
          logger.warn('请求被速率限制', {
            requestId: meta.requestId,
            path,
            ip: request.headers.get('x-forwarded-for'),
          });
          return rateLimitResponse;
        }
      }

      // 2. 检查认证
      if (requireAuth) {
        const session = await requireAdminSession(request, minRole);
        if (!session) {
          logger.warn('认证失败', {
            requestId: meta.requestId,
            path,
            ip: request.headers.get('x-forwarded-for'),
          });
          return errorResponse(
            '未授权访问，请先登录',
            'UNAUTHORIZED',
            request,
            401
          );
        }
      }

      // 3. 执行处理器
      const response = await handler(request, { meta });

      // 4. 日志记录 - 请求完成
      if (logResponse) {
        const result = await response.clone().json();
        logger.info('API 响应完成', {
          requestId: meta.requestId,
          method,
          path,
          status: response.status,
          success: result.success,
        });
      }

      return response;
    } catch (error) {
      // 错误处理和日志
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorCode = error instanceof ApiError ? error.code : 'UNKNOWN';
      const status = error instanceof ApiError ? error.status : 500;
      const details = error instanceof ApiError ? error.details : undefined;

      logger.error('API 请求出错', {
        requestId: meta.requestId,
        method,
        path,
        status,
        error: errorMessage,
        code: errorCode,
        stack: error instanceof Error ? error.stack : undefined,
        ...(details ? { details } : {}),
      });

      return errorResponse(
        errorMessage,
        errorCode as ErrorCode,
        request,
        status,
        details
      );
    }
  };
}

/**
 * 简化版 handler，自动包装常见的错误处理逻辑
 * 仅处理错误，不处理认证和速率限制
 * 
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchData();
 *   return successResponse(data, request);
 * });
 */
export function withErrorHandler(
  handler: (request: NextRequest, context: { meta: ApiResponseMeta }) => Promise<NextResponse>,
  logRequest = true,
  logResponse = true
) {
  return createApiHandler(handler, {
    requireAuth: false,
    rateLimit: false,
    logRequest,
    logResponse,
  });
}
