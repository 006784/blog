// 新闻收集系统类型定义

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'social';
  category: string;
  language: string;
  country?: string;
  isActive: boolean;
  lastFetched?: Date;
}

export interface RawNewsItem {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: Date;
  source: string;
  author?: string;
  imageUrl?: string;
  language: string;
  categories: string[];
  tags: string[];
}

export interface ProcessedNewsItem {
  id: string;
  originalTitle: string;
  translatedTitle: string;
  originalContent: string;
  translatedContent: string;
  summary: string;
  url: string;
  publishedAt: Date;
  source: string;
  author?: string;
  imageUrl?: string;
  originalLanguage: string;
  categories: string[];
  tags: string[];
  importanceScore: number;
  isDuplicate: boolean;
  createdAt: Date;
}

export interface NewsCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
}

export interface DailyNewsletter {
  id: string;
  date: Date;
  title: string;
  categories: {
    category: NewsCategory;
    items: ProcessedNewsItem[];
  }[];
  totalItems: number;
  createdAt: Date;
}

export interface NewsletterConfig {
  recipientEmail: string;
  sendTime: string; // HH:mm格式
  timezone: string;
  categories: string[];
  minImportanceScore: number;
  maxItemsPerCategory: number;
  includeSummary: boolean;
  includeImages: boolean;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  confidence: number;
  translationModel: string;
}

export interface NewsAggregationStats {
  totalCollected: number;
  totalProcessed: number;
  duplicatesRemoved: number;
  translationsCompleted: number;
  categoriesDistribution: Record<string, number>;
  sourcesDistribution: Record<string, number>;
  processingTime: number;
}