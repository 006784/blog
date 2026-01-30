/**
 * 环境变量验证和管理工具
 * 确保所有必需的环境变量都已正确配置
 */

interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // 管理员密码
  adminPassword: string;
  
  // 网站配置
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  
  // Cloudflare R2 (可选)
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  r2PublicUrl?: string;
  
  // Resend (可选)
  resendApiKey?: string;
  
  // Turnstile (可选)
  turnstileSiteKey?: string;
  turnstileSecretKey?: string;
  
  // Giscus (可选)
  giscusRepo?: string;
  giscusRepoId?: string;
  giscusCategory?: string;
  giscusCategoryId?: string;
  
  // Sentry (可选)
  sentryDsn?: string;
  sentryAuthToken?: string;
  publicSentryDsn?: string;
  
  // 健康检查 (可选)
  healthCheckToken?: string;
  
  // 日志
  logLevel: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * 验证必需的环境变量
 * @param includeServerOnly 是否包含仅服务端变量（如 ADMIN_PASSWORD）
 */
function validateRequiredEnv(includeServerOnly = false): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  // 仅在服务端验证服务端专用变量
  if (includeServerOnly && typeof window === 'undefined') {
    required.push('ADMIN_PASSWORD');
  }

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new EnvValidationError(
      `缺少必需的环境变量: ${missing.join(', ')}\n` +
      `请检查 .env.local 文件或环境变量配置。\n` +
      `参考 .env.example 文件了解所需配置。`
    );
  }
}

/**
 * 验证管理员密码强度
 */
function validateAdminPassword(password: string): void {
  if (password.length < 8) {
    throw new EnvValidationError(
      'ADMIN_PASSWORD 必须至少包含 8 个字符'
    );
  }

  // 检查是否使用了默认密码
  const defaultPasswords = ['shiguang2024', 'admin123', 'password', 'admin'];
  if (defaultPasswords.includes(password.toLowerCase())) {
    console.warn(
      '⚠️  警告: 检测到使用默认密码，请在生产环境中更改 ADMIN_PASSWORD'
    );
  }
}

/**
 * 获取并验证环境变量配置
 * @param includeServerOnly 是否包含仅服务端变量（如 ADMIN_PASSWORD）
 */
export function getEnvConfig(includeServerOnly = false): EnvConfig {
  // 验证必需变量（根据上下文决定是否包含服务端变量）
  validateRequiredEnv(includeServerOnly);

  // 仅在服务端获取管理员密码
  const adminPassword = (typeof window === 'undefined' && process.env.ADMIN_PASSWORD) || '';
  
  // 验证管理员密码（仅在服务端和生产环境）
  if (includeServerOnly && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    if (adminPassword) {
      validateAdminPassword(adminPassword);
    }
  }

  return {
    // Supabase (必需)
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    
    // 管理员密码 (仅在服务端可用)
    adminPassword: includeServerOnly ? adminPassword : '',
    
    // 网站配置
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || '拾光博客',
    siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '在文字中拾起生活的微光',
    
    // Cloudflare R2 (可选)
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME || 'resources',
    r2PublicUrl: process.env.R2_PUBLIC_URL,
    
    // Resend (可选)
    resendApiKey: process.env.RESEND_API_KEY,
    
    // Turnstile (可选)
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    
    // Giscus (可选)
    giscusRepo: process.env.NEXT_PUBLIC_GISCUS_REPO,
    giscusRepoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
    giscusCategory: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || 'General',
    giscusCategoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
    
    // Sentry (可选)
    sentryDsn: process.env.SENTRY_DSN,
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN,
    publicSentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // 健康检查 (可选)
    healthCheckToken: process.env.HEALTH_CHECK_TOKEN,
    
    // 日志
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

/**
 * 获取管理员密码（统一入口）
 * 仅在服务端可用
 */
export function getAdminPassword(): string {
  // 确保只在服务端调用
  if (typeof window !== 'undefined') {
    throw new EnvValidationError(
      'getAdminPassword() 只能在服务端调用'
    );
  }

  const password = process.env.ADMIN_PASSWORD;
  
  if (!password) {
    throw new EnvValidationError(
      'ADMIN_PASSWORD 环境变量未设置。这是必需的安全配置。'
    );
  }
  
  return password;
}

/**
 * 验证管理员密码
 */
export function verifyAdminPassword(inputPassword: string): boolean {
  const adminPassword = getAdminPassword();
  return inputPassword === adminPassword;
}

/**
 * 在应用启动时验证环境变量
 * 仅在服务端执行
 */
export function validateEnvOnStartup(): void {
  if (typeof window === 'undefined') {
    try {
      // 在服务端验证所有变量（包括服务端专用变量）
      getEnvConfig(true);
      console.log('✅ 环境变量验证通过');
    } catch (error) {
      if (error instanceof EnvValidationError) {
        console.error('❌ 环境变量验证失败:', error.message);
        // 在开发环境只警告，不中断启动
        if (process.env.NODE_ENV === 'production') {
          throw error;
        } else {
          console.warn('⚠️  开发环境：继续运行，但某些功能可能不可用');
        }
      } else {
        throw error;
      }
    }
  }
}

// 导出错误类型
export { EnvValidationError };
