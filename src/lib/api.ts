/**
 * 统一 API 响应工具
 * 所有 API 路由使用 { success, data, error, code } 结构
 */
import { NextRequest, NextResponse } from 'next/server';
import { z, type ZodSchema } from 'zod';
import { verifyAdminPassword } from './env';
import { requireAdminSession } from './auth-server';
export type { AdminRole } from './auth-edge';

// ——— 类型定义 ———

export type ApiSuccess<T = undefined> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T = undefined> = ApiSuccess<T> | ApiError;

// ——— 响应构建器 ———

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(
  message: string,
  status = 500,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message, ...(code ? { code } : {}) }, { status });
}

// ——— 鉴权辅助 ———

/**
 * 验证请求体中的 adminPassword 字段（旧式兼容，逐步废弃）
 */
export function requireAdmin(
  adminPassword: unknown
): NextResponse<ApiError> | null {
  if (typeof adminPassword !== 'string' || !verifyAdminPassword(adminPassword)) {
    return err('未授权访问', 401, 'UNAUTHORIZED');
  }
  return null;
}

/**
 * 基于 httpOnly cookie + JWT 的鉴权（新式，推荐）
 * 用于所有管理员 API Route
 *
 * @example
 * const authErr = await checkAdminSession(request);
 * if (authErr) return authErr;
 */
export async function checkAdminSession(
  request: NextRequest,
  minRole: 'editor' | 'admin' | 'super_admin' = 'editor'
): Promise<NextResponse<ApiError> | null> {
  const session = await requireAdminSession(request, minRole);
  if (!session) return err('未登录或会话已过期，请重新登录', 401, 'UNAUTHORIZED');
  return null;
}

// ——— 错误处理包装器 ———

type RouteHandler<T> = () => Promise<NextResponse<ApiResponse<T>>>;

/**
 * 包装路由处理函数，统一捕获未处理的异常
 * @example
 * export async function GET() {
 *   return withErrorHandler(async () => {
 *     const data = await fetchSomething();
 *     return ok(data);
 *   });
 * }
 */
export async function withErrorHandler<T>(
  handler: RouteHandler<T>,
  errorMessage = '服务器内部错误'
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler();
  } catch (error) {
    console.error('[API Error]', error);
    return err(errorMessage) as NextResponse<ApiResponse<T>>;
  }
}

// ——— Zod 请求体验证 ———

/**
 * 解析并验证请求体，失败时返回 400 响应
 * @example
 * const result = await parseBody(request, z.object({ email: z.string().email() }));
 * if (result instanceof NextResponse) return result; // 验证失败
 * const { email } = result; // 类型安全的数据
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T | NextResponse<ApiError>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err('请求体格式错误，需要 JSON', 400, 'INVALID_JSON');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join('；');
    return err(message, 400, 'VALIDATION_ERROR');
  }
  return result.data;
}

// ——— 常用 Zod Schema ———

export const schemas = {
  email: z.string().email('请输入有效的邮箱地址'),
  slug: z.string().regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和连字符'),
  adminPassword: z.string().min(1, '管理员密码不能为空'),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};

// 重新导出 z 方便路由直接使用
export { z };
