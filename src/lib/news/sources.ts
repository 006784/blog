// 新闻源配置管理
import { NewsSource } from '../types/news';

export const NEWS_SOURCES: NewsSource[] = [
  // 国际新闻源
  {
    id: 'reuters',
    name: '路透社',
    url: 'http://feeds.reuters.com/reuters/topNews',
    type: 'rss',
    category: 'international',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'bbc-world',
    name: 'BBC World',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    type: 'rss',
    category: 'international',
    language: 'en',
    country: 'UK',
    isActive: true
  },
  {
    id: 'ap-news',
    name: '美联社',
    url: 'https://rsshub.app/ap/topics/apf-topnews',
    type: 'rss',
    category: 'international',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'cnn-world',
    name: 'CNN International',
    url: 'http://rss.cnn.com/rss/edition.rss',
    type: 'rss',
    category: 'international',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'al-jazeera',
    name: '半岛电视台',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    type: 'rss',
    category: 'international',
    language: 'en',
    country: 'QA',
    isActive: true
  },

  // 科技新闻源
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'http://feeds.feedburner.com/TechCrunch/',
    type: 'rss',
    category: 'technology',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    type: 'rss',
    category: 'technology',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: '36kr',
    name: '36氪',
    url: 'https://36kr.com/feed',
    type: 'rss',
    category: 'technology',
    language: 'zh',
    country: 'CN',
    isActive: true
  },
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    type: 'rss',
    category: 'technology',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    url: 'http://feeds.arstechnica.com/arstechnica/index',
    type: 'rss',
    category: 'technology',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'engadget',
    name: 'Engadget',
    url: 'https://www.engadget.com/rss.xml',
    type: 'rss',
    category: 'technology',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'techradar',
    name: 'TechRadar',
    url: 'https://www.techradar.com/rss',
    type: 'rss',
    category: 'technology',
    language: 'en',
    country: 'UK',
    isActive: true
  },

  // 经济财经
  {
    id: 'bloomberg',
    name: '彭博社',
    url: 'https://www.bloomberg.com/politics/feeds/site.xml',
    type: 'rss',
    category: 'business',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'cnbc',
    name: 'CNBC',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    type: 'rss',
    category: 'business',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'caixin',
    name: '财新网',
    url: 'http://feeds.caixin.com/caixin/latest',
    type: 'rss',
    category: 'business',
    language: 'zh',
    country: 'CN',
    isActive: true
  },
  {
    id: 'ft-china',
    name: '金融时报',
    url: 'http://www.ftchinese.com/sc/rss/rss.html',
    type: 'rss',
    category: 'business',
    language: 'zh',
    country: 'UK',
    isActive: true
  },
  {
    id: 'wall-street-journal',
    name: '华尔街日报',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    type: 'rss',
    category: 'business',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'economist',
    name: '经济学人',
    url: 'https://www.economist.com/the-world-this-week/rss.xml',
    type: 'rss',
    category: 'business',
    language: 'en',
    country: 'UK',
    isActive: true
  },

  // 政治时事
  {
    id: 'politico',
    name: 'Politico',
    url: 'https://www.politico.com/rss/politicopicks.xml',
    type: 'rss',
    category: 'politics',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'guardian-politics',
    name: '卫报政治',
    url: 'https://www.theguardian.com/politics/rss',
    type: 'rss',
    category: 'politics',
    language: 'en',
    country: 'UK',
    isActive: true
  },
  {
    id: 'reuters-politics',
    name: '路透社政治',
    url: 'http://feeds.reuters.com/Reuters/PoliticsNews',
    type: 'rss',
    category: 'politics',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'axios-politics',
    name: 'Axios Politics',
    url: 'https://api.axios.com/feed/politics/',
    type: 'rss',
    category: 'politics',
    language: 'en',
    country: 'US',
    isActive: true
  },

  // 文化娱乐
  {
    id: 'variety',
    name: 'Variety',
    url: 'https://variety.com/feed/',
    type: 'rss',
    category: 'entertainment',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'rolling-stone',
    name: '滚石杂志',
    url: 'https://www.rollingstone.com/feed/',
    type: 'rss',
    category: 'entertainment',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'billboard',
    name: 'Billboard',
    url: 'https://www.billboard.com/feed/',
    type: 'rss',
    category: 'entertainment',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'hollywood-reporter',
    name: '好莱坞报道',
    url: 'https://www.hollywoodreporter.com/feed/',
    type: 'rss',
    category: 'entertainment',
    language: 'en',
    country: 'US',
    isActive: true
  },

  // 体育新闻
  {
    id: 'espn',
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    type: 'rss',
    category: 'sports',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'sports-illustrated',
    name: '体育画报',
    url: 'https://www.si.com/rss/si_topstories.rss',
    type: 'rss',
    category: 'sports',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'the-athletic',
    name: 'The Athletic',
    url: 'https://theathletic.com/feed/',
    type: 'rss',
    category: 'sports',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'marca',
    name: '马卡报',
    url: 'https://e00-marca.uecdn.es/rss/futbol.xml',
    type: 'rss',
    category: 'sports',
    language: 'es',
    country: 'ES',
    isActive: true
  },

  // 科学探索
  {
    id: 'scientific-american',
    name: '科学美国人',
    url: 'https://www.scientificamerican.com/sciam/rss/all.xml',
    type: 'rss',
    category: 'science',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'nature',
    name: '自然杂志',
    url: 'https://www.nature.com/nature/articles?type=article.rss',
    type: 'rss',
    category: 'science',
    language: 'en',
    country: 'UK',
    isActive: true
  },
  {
    id: 'science-magazine',
    name: '科学杂志',
    url: 'https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science',
    type: 'rss',
    category: 'science',
    language: 'en',
    country: 'US',
    isActive: true
  },
  {
    id: 'phys-org',
    name: 'Phys.org',
    url: 'https://phys.org/rss-feed/',
    type: 'rss',
    category: 'science',
    language: 'en',
    country: 'US',
    isActive: true
  }
];

export const NEWS_CATEGORIES = [
  {
    id: 'international',
    name: '国际',
    displayName: '🌍 国际新闻',
    description: '全球时事、国际关系、外交政策',
    color: '#3b82f6',
    icon: '🌍'
  },
  {
    id: 'politics',
    name: '政治',
    displayName: '🏛️ 政治时事',
    description: '政府政策、选举、政治动态',
    color: '#ef4444',
    icon: '🏛️'
  },
  {
    id: 'technology',
    name: '科技',
    displayName: '💻 科技前沿',
    description: '科技创新、互联网、人工智能',
    color: '#8b5cf6',
    icon: '💻'
  },
  {
    id: 'business',
    name: '商业',
    displayName: '💼 商业财经',
    description: '经济动态、市场分析、企业新闻',
    color: '#10b981',
    icon: '💼'
  },
  {
    id: 'entertainment',
    name: '娱乐',
    displayName: '🎬 文娱生活',
    description: '影视、音乐、文化、生活方式',
    color: '#f59e0b',
    icon: '🎬'
  },
  {
    id: 'sports',
    name: '体育',
    displayName: '⚽ 体育竞技',
    description: '各类体育赛事、运动员动态',
    color: '#ec4899',
    icon: '⚽'
  },
  {
    id: 'science',
    name: '科学',
    displayName: '🔬 科学探索',
    description: '科学研究、发现、学术进展',
    color: '#06b6d4',
    icon: '🔬'
  }
];

// 获取活跃的新闻源
export function getActiveSources(): NewsSource[] {
  return NEWS_SOURCES.filter(source => source.isActive);
}

// 根据分类获取新闻源
export function getSourcesByCategory(category: string): NewsSource[] {
  return NEWS_SOURCES.filter(source => 
    source.category === category && source.isActive
  );
}

// 根据语言获取新闻源
export function getSourcesByLanguage(language: string): NewsSource[] {
  return NEWS_SOURCES.filter(source => 
    source.language === language && source.isActive
  );
}