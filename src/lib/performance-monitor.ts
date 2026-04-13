/**
 * 性能监控系统
 * 追踪 API 响应时间、数据库查询时间等关键指标
 */
import { logger } from './logger';

// ——— 性能指标类型 ———

export interface PerformanceMetric {
  name: string;
  duration: number; // 毫秒
  timestamp: string;
  tags?: Record<string, string>;
  value?: number;
}

export interface PerformanceThresholds {
  warning?: number; // 毫秒
  critical?: number; // 毫秒
}

// ——— 性能监控器 ———

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: Map<string, PerformanceThresholds> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * 设置性能指标警告阈值
   */
  setThreshold(name: string, threshold: PerformanceThresholds) {
    this.thresholds.set(name, threshold);
  }

  /**
   * 开始计时
   */
  start(operationName: string): void {
    const id = `${operationName}_${Date.now()}_${Math.random()}`;
    this.startTimes.set(id, performance.now());
  }

  /**
   * 完成计时并记录指标
   */
  end(
    operationName: string,
    tags?: Record<string, string>,
    endId?: string
  ): number {
    const id = endId || `${operationName}_${Date.now()}_${Math.random()}`;
    const startTime = this.startTimes.get(id);

    if (!startTime) {
      logger.warn('性能计时器未找到开始时间', { operationName, id });
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(id);

    const metric: PerformanceMetric = {
      name: operationName,
      duration,
      timestamp: new Date().toISOString(),
      tags,
    };

    this.metrics.push(metric);

    // 检查阈值
    this.checkThreshold(metric);

    return duration;
  }

  /**
   * 使用装饰器模式测量函数执行时间
   */
  measure<T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T,
    tags?: Record<string, string>
  ): T {
    const bound = ((...args: unknown[]) => {
      const startId = `${name}_${Date.now()}_${Math.random()}`;
      this.start(startId);

      try {
        const result = fn(...args);

        // 处理 Promise
        if (result instanceof Promise) {
          return result
            .then((value) => {
              this.end(name, tags, startId);
              return value;
            })
            .catch((error) => {
              this.end(name, { ...tags, error: 'true' }, startId);
              throw error;
            });
        }

        this.end(name, tags, startId);
        return result;
      } catch (error) {
        this.end(name, { ...tags, error: 'true' }, startId);
        throw error;
      }
    }) as T;

    return bound;
  }

  /**
   * 获取所有收集的指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取特定操作的指标统计
   */
  getStats(operationName: string) {
    const operationMetrics = this.metrics.filter((m) => m.name === operationName);

    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map((m) => m.duration);
    const total = durations.reduce((a, b) => a + b, 0);
    const avg = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const p95 = this.percentile(durations, 0.95);
    const p99 = this.percentile(durations, 0.99);

    return {
      count: operationMetrics.length,
      total,
      avg,
      min,
      max,
      p95,
      p99,
    };
  }

  /**
   * 清空指标
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * 报告所有指标
   */
  report(): void {
    const operationNames = new Set(this.metrics.map((m) => m.name));

    for (const name of operationNames) {
      const stats = this.getStats(name);
      if (stats) {
        logger.metric(name, stats.avg, 'ms', {
          count: stats.count,
          min: stats.min,
          max: stats.max,
          p95: stats.p95,
          p99: stats.p99,
        });
      }
    }
  }

  /**
   * 检查性能指标是否超过阈值
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold) {
      return;
    }

    if (threshold.critical && metric.duration > threshold.critical) {
      logger.warn('性能指标 - 严重', {
        operation: metric.name,
        duration: metric.duration,
        threshold: threshold.critical,
        tags: metric.tags,
      });
    } else if (threshold.warning && metric.duration > threshold.warning) {
      logger.warn('性能指标 - 警告', {
        operation: metric.name,
        duration: metric.duration,
        threshold: threshold.warning,
        tags: metric.tags,
      });
    }
  }

  /**
   * 计算百分位数
   */
  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

// ——— 全局实例 ———

export const performanceMonitor = new PerformanceMonitor();

// ——— 初始化默认阈值 ———

performanceMonitor.setThreshold('database-query', {
  warning: 100,
  critical: 500,
});

performanceMonitor.setThreshold('api-request', {
  warning: 200,
  critical: 1000,
});

performanceMonitor.setThreshold('external-service', {
  warning: 500,
  critical: 2000,
});

// ——— 导出便利函数 ———

/**
 * 测量异步操作
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const startId = `${name}_${Date.now()}_${Math.random()}`;
  performanceMonitor.start(startId);

  try {
    const result = await fn();
    performanceMonitor.end(name, tags, startId);
    return result;
  } catch (error) {
    performanceMonitor.end(name, { ...tags, error: 'true' }, startId);
    throw error;
  }
}

/**
 * 测量同步操作
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const startId = `${name}_${Date.now()}_${Math.random()}`;
  performanceMonitor.start(startId);

  try {
    const result = fn();
    performanceMonitor.end(name, tags, startId);
    return result;
  } catch (error) {
    performanceMonitor.end(name, { ...tags, error: 'true' }, startId);
    throw error;
  }
}

/**
 * 定期报告性能指标（建议在应用启动时调用）
 */
export function startPerformanceReporting(intervalMs: number = 60000) {
  setInterval(() => {
    performanceMonitor.report();
    performanceMonitor.clear();
  }, intervalMs);
}
