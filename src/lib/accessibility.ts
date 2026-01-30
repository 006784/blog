import { useEffect, useRef, useState } from 'react';

// ARIA标签生成器
export function generateAriaLabels(elementType: string, content: string, index?: number): Record<string, string> {
  const baseLabel = content.trim();
  
  switch (elementType) {
    case 'navigation':
      return {
        'aria-label': `${baseLabel} 导航菜单`,
        'role': 'navigation'
      };
    
    case 'button':
      return {
        'aria-label': baseLabel,
        'role': 'button'
      };
    
    case 'link':
      return {
        'aria-label': `前往 ${baseLabel}`,
        'role': 'link'
      };
    
    case 'image':
      return {
        'aria-label': baseLabel,
        'role': 'img',
        'aria-hidden': baseLabel ? 'false' : 'true'
      };
    
    case 'card':
      return {
        'aria-label': `卡片: ${baseLabel}`,
        'role': 'article'
      };
    
    case 'list':
      return {
        'aria-label': `${baseLabel} 列表`,
        'role': 'list'
      };
    
    case 'listitem':
      return {
        'aria-label': baseLabel,
        'role': 'listitem'
      };
    
    default:
      return {
        'aria-label': baseLabel
      };
  }
}

// 键盘导航支持
export function useKeyboardNavigation(callbacks: {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  onTab?: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        callbacks.onEnter?.();
        break;
      case 'Escape':
        event.preventDefault();
        callbacks.onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        callbacks.onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        callbacks.onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        callbacks.onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        callbacks.onArrowRight?.();
        break;
      case ' ':
        event.preventDefault();
        callbacks.onSpace?.();
        break;
      case 'Tab':
        callbacks.onTab?.();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callbacks]);
}

// 焦点管理工具
export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  const handleFocus = (event: FocusEvent) => {
    if (!ref.current) return;
    
    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (event.relatedTarget === lastElement) {
      event.preventDefault();
      firstElement.focus();
    } else if (event.relatedTarget === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('focusout', handleFocus);
    return () => {
      element.removeEventListener('focusout', handleFocus);
    };
  }, [ref]);
}

// 屏幕阅读器通知
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // 自动清理
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// 跳转链接组件支持
export function createSkipLink(href: string, label: string) {
  return {
    href,
    'aria-label': label,
    className: 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded'
  };
}

// 表单可访问性增强
export function enhanceFormAccessibility(formRef: React.RefObject<HTMLFormElement>) {
  useEffect(() => {
    if (!formRef.current) return;
    
    const form = formRef.current;
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement;
      
      // 添加必要的ARIA属性
      if (!element.hasAttribute('aria-describedby') && element.nextElementSibling?.classList.contains('error-message')) {
        element.setAttribute('aria-describedby', `error-${element.id || index}`);
      }
      
      // 确保必填字段有适当标记
      if (element.required) {
        element.setAttribute('aria-required', 'true');
      }
      
      // 添加无效状态标记
      if (!element.validity.valid) {
        element.setAttribute('aria-invalid', 'true');
      }
    });
  }, [formRef]);
}

// 图片可访问性
export function getImageAccessibilityProps(alt: string, decorative: boolean = false): Record<string, string> {
  if (decorative) {
    return {
      'aria-hidden': 'true',
      'role': 'presentation',
      'alt': ''
    };
  }
  
  return {
    'alt': alt,
    'role': 'img'
  };
}

// 表格可访问性
export function enhanceTableAccessibility(tableRef: React.RefObject<HTMLTableElement>) {
  useEffect(() => {
    if (!tableRef.current) return;
    
    const table = tableRef.current;
    
    // 确保表格有caption
    if (!table.querySelector('caption')) {
      const caption = document.createElement('caption');
      caption.className = 'sr-only';
      caption.textContent = '数据表格';
      table.insertBefore(caption, table.firstChild);
    }
    
    // 为表头添加scope属性
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
      if (header.parentElement?.tagName === 'THEAD') {
        header.setAttribute('scope', 'col');
      } else if (header.parentElement?.tagName === 'TBODY') {
        header.setAttribute('scope', 'row');
      }
    });
  }, [tableRef]);
}

// 动态内容更新通知
export function useLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!liveRegionRef.current) {
      const region = document.createElement('div');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      region.id = 'live-region';
      document.body.appendChild(region);
      liveRegionRef.current = region;
    }
    
    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);
  
  const announce = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  };
  
  return { announce, ref: liveRegionRef };
}

// 高对比度模式检测
export function useHighContrastMode(): boolean {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return isHighContrast;
}

// 减少动画偏好检测
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}

