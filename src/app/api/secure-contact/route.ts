import { NextRequest, NextResponse } from 'next/server';
import { 
  sanitizeInput, 
  isValidURL, 
  csrfProtection,
  createSecureResponse,
  validateInput
} from '@/lib/security';
import { logger } from '@/lib/logger';

// 模拟的联系表单数据接口
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

// 验证规则
const validationRules = {
  name: (value: string) => {
    if (typeof value !== 'string' || value.trim().length < 2) {
      return '姓名至少需要2个字符';
    }
    return true;
  },
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value !== 'string' || !emailRegex.test(value)) {
      return '请输入有效的邮箱地址';
    }
    return true;
  },
  subject: (value: string) => {
    if (typeof value !== 'string' || value.trim().length < 5) {
      return '主题至少需要5个字符';
    }
    return true;
  },
  message: (value: string) => {
    if (typeof value !== 'string' || value.trim().length < 10) {
      return '消息内容至少需要10个字符';
    }
    if (value.length > 1000) {
      return '消息内容不能超过1000个字符';
    }
    return true;
  },
  website: (value: string) => {
    if (value && typeof value === 'string') {
      if (!isValidURL(value)) {
        return '请输入有效的网站URL';
      }
    }
    return true;
  }
};

// 验证函数
function validateContactForm(data: any): string[] {
  const errors: string[] = [];
  
  // 验证每个字段
  Object.entries(validationRules).forEach(([field, validator]) => {
    const value = data[field];
    const result = validator(value);
    
    if (result !== true) {
      errors.push(typeof result === 'string' ? result : `字段 "${field}" 验证失败`);
    }
  });
  
  return errors;
}

// 处理联系表单的主函数
async function processContactForm(data: ContactFormData) {
  // 这里应该是实际的业务逻辑
  logger.info('处理联系表单', { 
    name: data.name,
    email: data.email,
    subject: data.subject
  });
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    success: true,
    message: '感谢您的留言，我们会尽快回复您！',
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. CSRF保护检查
    if (!csrfProtection(request)) {
      logger.warn('CSRF验证失败', {
        method: request.method,
        url: request.url,
        origin: request.headers.get('origin')
      });
      
      return createSecureResponse(
        { success: false, error: '安全验证失败' },
        { status: 403 }
      );
    }

    // 2. 解析请求体
    const rawData = await request.json();
    
    // 3. 输入清理
    const cleanData = sanitizeInput(rawData) as ContactFormData;
    
    // 4. 数据验证
    const validationErrors = validateContactForm(cleanData);
    if (validationErrors.length > 0) {
      return createSecureResponse(
        { 
          success: false, 
          errors: validationErrors,
          message: '数据验证失败'
        },
        { status: 400 }
      );
    }
    
    // 5. 业务逻辑处理
    const result = await processContactForm(cleanData);
    
    // 5. 返回安全响应
    return createSecureResponse(result);
    
  } catch (error) {
    logger.error('处理联系表单时发生错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return createSecureResponse(
      { 
        success: false, 
        error: '处理请求时发生错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 对于GET请求，返回API信息
  return createSecureResponse({
    success: true,
    message: '联系表单API端点',
    methods: ['POST'],
    description: '提交联系表单数据',
    security: {
      csrfProtection: true,
      inputSanitization: true,
      rateLimiting: 'configured but not enforced in this demo'
    }
  });
}