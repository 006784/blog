// 国际化配置
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 语言资源
export const resources = {
  zh: {
    translation: {
      // 导航
      'nav.home': '首页',
      'nav.blog': '博客',
      'nav.about': '关于',
      'nav.contact': '联系',
      'nav.music': '音乐',
      'nav.gallery': '相册',
      'nav.diary': '日记',
      'nav.resources': '资源',
      'nav.guestbook': '留言簿',
      'nav.links': '友链',
      
      // 通用
      'common.loading': '加载中...',
      'common.error': '出现错误',
      'common.success': '操作成功',
      'common.save': '保存',
      'common.cancel': '取消',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.view': '查看',
      'common.search': '搜索',
      'common.filter': '筛选',
      'common.sort': '排序',
      
      // 博客相关
      'blog.readMore': '阅读全文',
      'blog.published': '发布于',
      'blog.updated': '更新于',
      'blog.category': '分类',
      'blog.tags': '标签',
      'blog.noPosts': '暂无文章',
      'blog.backToList': '返回列表',
      
      // 表单
      'form.name': '姓名',
      'form.email': '邮箱',
      'form.subject': '主题',
      'form.message': '消息',
      'form.submit': '提交',
      'form.reset': '重置',
      'form.required': '此字段为必填项',
      
      // 时间
      'time.justNow': '刚刚',
      'time.minutesAgo': '{{count}}分钟前',
      'time.hoursAgo': '{{count}}小时前',
      'time.daysAgo': '{{count}}天前',
      'time.weeksAgo': '{{count}}周前',
      'time.monthsAgo': '{{count}}个月前',
      'time.yearsAgo': '{{count}}年前',
      
      // 分页
      'pagination.previous': '上一页',
      'pagination.next': '下一页',
      'pagination.first': '首页',
      'pagination.last': '末页',
      'pagination.page': '第{{page}}页',
      'pagination.of': '共{{total}}页',
      
      // 状态
      'status.online': '在线',
      'status.offline': '离线',
      'status.loading': '加载中',
      'status.error': '错误',
      'status.success': '成功',
      
      // 操作确认
      'confirm.delete': '确定要删除吗？',
      'confirm.save': '确定要保存吗？',
      'confirm.cancel': '确定要取消吗？',
      
      // 错误信息
      'error.network': '网络连接失败',
      'error.timeout': '请求超时',
      'error.notFound': '页面未找到',
      'error.server': '服务器错误',
      'error.unknown': '未知错误'
    }
  },
  en: {
    translation: {
      // Navigation
      'nav.home': 'Home',
      'nav.blog': 'Blog',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'nav.music': 'Music',
      'nav.gallery': 'Gallery',
      'nav.diary': 'Diary',
      'nav.resources': 'Resources',
      'nav.guestbook': 'Guestbook',
      'nav.links': 'Links',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Operation successful',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.view': 'View',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.sort': 'Sort',
      
      // Blog
      'blog.readMore': 'Read More',
      'blog.published': 'Published',
      'blog.updated': 'Updated',
      'blog.category': 'Category',
      'blog.tags': 'Tags',
      'blog.noPosts': 'No posts available',
      'blog.backToList': 'Back to List',
      
      // Forms
      'form.name': 'Name',
      'form.email': 'Email',
      'form.subject': 'Subject',
      'form.message': 'Message',
      'form.submit': 'Submit',
      'form.reset': 'Reset',
      'form.required': 'This field is required',
      
      // Time
      'time.justNow': 'Just now',
      'time.minutesAgo': '{{count}} minute ago',
      'time.minutesAgo_plural': '{{count}} minutes ago',
      'time.hoursAgo': '{{count}} hour ago',
      'time.hoursAgo_plural': '{{count}} hours ago',
      'time.daysAgo': '{{count}} day ago',
      'time.daysAgo_plural': '{{count}} days ago',
      'time.weeksAgo': '{{count}} week ago',
      'time.weeksAgo_plural': '{{count}} weeks ago',
      'time.monthsAgo': '{{count}} month ago',
      'time.monthsAgo_plural': '{{count}} months ago',
      'time.yearsAgo': '{{count}} year ago',
      'time.yearsAgo_plural': '{{count}} years ago',
      
      // Pagination
      'pagination.previous': 'Previous',
      'pagination.next': 'Next',
      'pagination.first': 'First',
      'pagination.last': 'Last',
      'pagination.page': 'Page {{page}}',
      'pagination.of': 'of {{total}}',
      
      // Status
      'status.online': 'Online',
      'status.offline': 'Offline',
      'status.loading': 'Loading',
      'status.error': 'Error',
      'status.success': 'Success',
      
      // Confirmations
      'confirm.delete': 'Are you sure you want to delete?',
      'confirm.save': 'Are you sure you want to save?',
      'confirm.cancel': 'Are you sure you want to cancel?',
      
      // Error messages
      'error.network': 'Network connection failed',
      'error.timeout': 'Request timeout',
      'error.notFound': 'Page not found',
      'error.server': 'Server error',
      'error.unknown': 'Unknown error'
    }
  }
};

// 初始化i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React已经安全处理
    },
    
    detection: {
      // 语言检测选项
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// 语言切换工具
export const languageUtils = {
  getCurrentLanguage: (): string => {
    return i18n.language || 'zh';
  },
  
  changeLanguage: async (lng: string): Promise<void> => {
    await i18n.changeLanguage(lng);
  },
  
  getLanguages: (): Array<{code: string, name: string}> => {
    return [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ];
  },
  
  isRTL: (lng: string): boolean => {
    return ['ar', 'he', 'fa'].includes(lng);
  }
};

// 格式化工具
export const formatUtils = {
  // 格式化日期
  formatDate: (date: Date | string, lng?: string): string => {
    const lang = lng || i18n.language;
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  },
  
  // 格式化相对时间
  formatRelativeTime: (date: Date | string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    const intervals = [
      { label: 'time.yearsAgo', seconds: 31536000 },
      { label: 'time.monthsAgo', seconds: 2592000 },
      { label: 'time.weeksAgo', seconds: 604800 },
      { label: 'time.daysAgo', seconds: 86400 },
      { label: 'time.hoursAgo', seconds: 3600 },
      { label: 'time.minutesAgo', seconds: 60 }
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds);
      if (count >= 1) {
        return i18n.t(interval.label, { count });
      }
    }
    
    return i18n.t('time.justNow');
  },
  
  // 格式化数字
  formatNumber: (num: number, lng?: string): string => {
    const lang = lng || i18n.language;
    return new Intl.NumberFormat(lang).format(num);
  }
};

