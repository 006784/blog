import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';


// 配置静态导出
export const dynamic = "force-static";
export const revalidate = 0;
// 健康检查状态
let healthStatus = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  version: process.env.npm_package_version || 'unknown'
};

// 更新健康状态
function updateHealthStatus() {
  healthStatus = {
    ...healthStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
}

// 定期更新健康状态
setInterval(updateHealthStatus, 30000); // 每30秒更新一次

export async function GET(request: NextRequest) {
  try {
    // 检查基本服务
    const checks = {
      server: true,
      database: await checkDatabase(),
      cache: await checkCache(),
      storage: await checkStorage()
    };

    // 计算总体健康状态
    const isHealthy = Object.values(checks).every(check => check === true);
    const status = isHealthy ? 'healthy' : 'degraded';
    
    const response = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: healthStatus.version,
      checks,
      system: {
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
        },
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    logger.info('健康检查完成', { status, checks });
    
    return NextResponse.json(response, { 
      status: isHealthy ? 200 : 503 
    });

  } catch (error) {
    logger.error('健康检查失败', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 });
  }
}

// POST方法用于手动触发健康检查更新
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // 简单的认证检查（在生产环境中应该使用更安全的方法）
    if (authHeader !== `Bearer ${process.env.HEALTH_CHECK_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    updateHealthStatus();
    
    logger.info('手动更新健康状态');
    
    return NextResponse.json({ 
      message: 'Health status updated',
      timestamp: healthStatus.timestamp 
    });

  } catch (error) {
    logger.error('手动健康检查更新失败', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return NextResponse.json({ error: 'Failed to update health status' }, { status: 500 });
  }
}

// 数据库连接检查
async function checkDatabase(): Promise<boolean> {
  try {
    // 这里应该实际检查数据库连接
    // 示例：await supabase.from('test_table').select('count').limit(1);
    return true; // 模拟成功
  } catch (error) {
    logger.warn('数据库健康检查失败', { error });
    return false;
  }
}

// 缓存服务检查
async function checkCache(): Promise<boolean> {
  try {
    // 这里应该实际检查Redis或其他缓存服务
    // 示例：await redis.ping();
    return true; // 模拟成功
  } catch (error) {
    logger.warn('缓存健康检查失败', { error });
    return false;
  }
}

// 存储服务检查
async function checkStorage(): Promise<boolean> {
  try {
    // 检查文件系统或云存储可用性
    return true; // 模拟成功
  } catch (error) {
    logger.warn('存储健康检查失败', { error });
    return false;
  }
}