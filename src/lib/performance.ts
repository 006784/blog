// 性能优化工具库
import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

// 图片懒加载配置
export const LAZY_LOAD_CONFIG = {
  rootMargin: '50px',
  threshold: 0.1
};

// 资源预加载类型
export type PreloadResource = {
  url: string;
  type: 'image' | 'script' | 'style' | 'font';
  as?: string;
  crossOrigin?: string;
};

type PerformanceMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

type PerformanceWithExtensions = Performance & {
  memory?: PerformanceMemory;
  timing?: PerformanceTiming;
};

type NavigatorConnection = {
  effectiveType?: string;
  downlink?: number;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

type NavigatorWithConnection = Navigator & {
  connection?: NavigatorConnection;
};

// 懒加载图片组件
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView(LAZY_LOAD_CONFIG);

  useEffect(() => {
    if (inView && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setLoaded(true);
      };
      img.src = src;
    }
  }, [inView, src]);

  return { ref, src: imageSrc, loaded };
}

// 资源预加载工具
export class ResourcePreloader {
  private static preloadCache = new Set<string>();

  static preload(resources: PreloadResource[]) {
    resources.forEach(resource => {
      if (this.preloadCache.has(resource.url)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.type;
      
      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }
      
      document.head.appendChild(link);
      this.preloadCache.add(resource.url);
    });
  }

  static preloadImage(url: string) {
    this.preload([{ url, type: 'image' }]);
  }

  static preloadScript(url: string) {
    this.preload([{ url, type: 'script' }]);
  }

  static preloadStyle(url: string) {
    this.preload([{ url, type: 'style' }]);
  }
}

// 性能监控工具
export class PerformanceMonitor {
  private static marks: Record<string, number> = {};
  private static measures: Record<string, number> = {};

  static mark(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks[name] = performance.now();
    }
  }

  static measure(name: string, startMark: string, endMark: string) {
    if (typeof performance !== 'undefined') {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      this.measures[name] = measure.duration;
      return measure.duration;
    }
    return 0;
  }

  static getMeasure(name: string): number {
    return this.measures[name] || 0;
  }

  static getAllMeasures(): Record<string, number> {
    return { ...this.measures };
  }

  static clearMarks() {
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
      this.marks = {};
      this.measures = {};
    }
  }
}

// 内存使用监控
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    total: 0,
    usage: 0
  });

  useEffect(() => {
    const updateMemory = () => {
      const perf = performance as PerformanceWithExtensions;
      if (perf.memory) {
        const { usedJSHeapSize, totalJSHeapSize } = perf.memory;
        setMemoryInfo({
          used: Math.round(usedJSHeapSize / 1048576), // MB
          total: Math.round(totalJSHeapSize / 1048576), // MB
          usage: Math.round((usedJSHeapSize / totalJSHeapSize) * 100)
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// 网络状况监控
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: '4g',
    downlink: 10
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const browserNavigator = navigator as NavigatorWithConnection;
      if (browserNavigator.connection) {
        const { effectiveType, downlink } = browserNavigator.connection;
        setNetworkStatus({
          online: navigator.onLine,
          effectiveType: effectiveType || '4g',
          downlink: downlink || 10
        });
      } else {
        setNetworkStatus({
          online: navigator.onLine,
          effectiveType: 'unknown',
          downlink: 0
        });
      }
    };

    updateNetworkStatus();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateNetworkStatus);
      window.addEventListener('offline', updateNetworkStatus);
      
      const browserNavigator = navigator as NavigatorWithConnection;
      if (browserNavigator.connection?.addEventListener) {
        browserNavigator.connection.addEventListener('change', updateNetworkStatus);
      }

      return () => {
        window.removeEventListener('online', updateNetworkStatus);
        window.removeEventListener('offline', updateNetworkStatus);
        
        if (browserNavigator.connection?.removeEventListener) {
          browserNavigator.connection.removeEventListener('change', updateNetworkStatus);
        }
      };
    }
  }, []);

  return networkStatus;
}

// 防抖优化
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流优化
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(0);

  useEffect(() => {
    if (lastRan.current === 0) {
      lastRan.current = Date.now();
      return;
    }

    const elapsed = Date.now() - lastRan.current;
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, Math.max(limit - elapsed, 0));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Intersection Observer优化
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([]);
  const [nodeRefs, setNodeRefs] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (nodeRefs.length === 0) return;

    const observer = new IntersectionObserver((observedEntries) => {
      setEntries(observedEntries);
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });

    nodeRefs.forEach(node => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [nodeRefs, options]);

  const registerNode = (node: HTMLElement | null) => {
    if (node && !nodeRefs.includes(node)) {
      setNodeRefs(prev => [...prev, node]);
    }
  };

  return { entries, registerNode };
}

// Bundle分析工具
export class BundleAnalyzer {
  static analyze() {
    if (typeof window === 'undefined') return null;
    const perf = performance as PerformanceWithExtensions;
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      memory: perf.memory ? {
        used: perf.memory.usedJSHeapSize,
        total: perf.memory.totalJSHeapSize,
        limit: perf.memory.jsHeapSizeLimit
      } : null,
      timing: perf.timing ? {
        navigationStart: perf.timing.navigationStart,
        domContentLoaded: perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart,
        loadEvent: perf.timing.loadEventEnd - perf.timing.navigationStart
      } : null
    };
  }

  static sendToAnalytics(data: unknown) {
    // 这里可以集成到你的分析服务。
    void data;
  }
}
