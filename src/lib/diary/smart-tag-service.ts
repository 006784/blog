// 智能标签系统服务
// 用于自动生成基于日记内容的标签

interface Tag {
  id: string;
  name: string;
  type: 'emotion' | 'weather' | 'activity' | 'location' | 'custom';
  confidence: number; // 置信度 0-1
  color: string;
}

export interface GeneratedTags {
  emotions: Tag[];
  activities: Tag[];
  weather: Tag[];
  locations: Tag[];
  custom: Tag[];
}

// 情绪关键词词典
const EMOTION_KEYWORDS = {
  happy: ['开心', '快乐', '高兴', '愉悦', '兴奋', '激动', '满足', '幸福', '喜悦', '欢欣'],
  sad: ['难过', '伤心', '沮丧', '失落', '忧郁', '悲伤', '痛苦', '郁闷', '失望', '哀伤'],
  angry: ['生气', '愤怒', '恼火', '烦躁', '不满', '愤慨', '暴怒', '恼怒', '气愤'],
  anxious: ['焦虑', '担心', '紧张', '不安', '忧虑', '恐慌', '恐惧', '害怕'],
  calm: ['平静', '安宁', '放松', '舒缓', '宁静', '平和', '淡定'],
  excited: ['兴奋', '激动', '热血', '澎湃', '振奋', '狂热'],
  tired: ['疲惫', '累', '困倦', '疲劳', '乏力', '倦怠'],
  energetic: ['精力充沛', '充满活力', '朝气蓬勃', '精神抖擞']
};

// 活动关键词词典
const ACTIVITY_KEYWORDS = {
  work: ['工作', '上班', '办公', '会议', '项目', '任务', '加班'],
  study: ['学习', '读书', '复习', '考试', '课程', '研究', '学术'],
  travel: ['旅行', '旅游', '出游', '度假', '观光', '游览', '远足'],
  exercise: ['运动', '健身', '跑步', '游泳', '瑜伽', '锻炼', '打球'],
  social: ['聚会', '朋友', '社交', '约会', '聚餐', 'party'],
  family: ['家人', '家庭', '父母', '孩子', '亲戚', '回家'],
  creative: ['创作', '写作', '绘画', '音乐', '手工', 'DIY'],
  rest: ['休息', '睡觉', '放松', '休假', '闲逛']
};

// 天气关键词映射
const WEATHER_MAPPING: Record<string, string[]> = {
  sunny: ['晴天', '阳光', '明媚', '万里无云'],
  cloudy: ['阴天', '多云', '乌云', '阴沉'],
  rainy: ['下雨', '雨天', '雨水', '降雨'],
  snowy: ['下雪', '雪天', '雪花', '降雪'],
  windy: ['刮风', '大风', '风大', '微风'],
  foggy: ['雾天', '雾霾', '迷雾', '薄雾']
};

export class SmartTagService {
  /**
   * 根据日记内容生成智能标签
   */
  static generateTags(content: string, weatherCondition?: string): GeneratedTags {
    const result: GeneratedTags = {
      emotions: [],
      activities: [],
      weather: [],
      locations: [],
      custom: []
    };

    // 生成情绪标签
    result.emotions = this.generateEmotionTags(content);
    
    // 生成活动标签
    result.activities = this.generateActivityTags(content);
    
    // 生成天气标签
    if (weatherCondition) {
      result.weather = this.generateWeatherTags(weatherCondition);
    }
    
    // 生成位置标签（从内容中提取）
    result.locations = this.extractLocationTags(content);
    
    // 生成自定义标签（基于高频词汇）
    result.custom = this.generateCustomTags(content);

    return result;
  }

  /**
   * 生成情绪标签
   */
  private static generateEmotionTags(content: string): Tag[] {
    const tags: Tag[] = [];
    const lowerContent = content.toLowerCase();

    Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
      let matchCount = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        if (matches) {
          matchCount += matches.length;
        }
      });

      if (matchCount > 0) {
        // 计算置信度（基于匹配次数和内容长度）
        const confidence = Math.min(matchCount / (content.length / 50), 0.95);
        
        tags.push({
          id: `emotion-${emotion}`,
          name: this.getEmotionDisplayName(emotion),
          type: 'emotion',
          confidence,
          color: this.getEmotionColor(emotion)
        });
      }
    });

    return tags.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * 生成活动标签
   */
  private static generateActivityTags(content: string): Tag[] {
    const tags: Tag[] = [];
    const lowerContent = content.toLowerCase();

    Object.entries(ACTIVITY_KEYWORDS).forEach(([activity, keywords]) => {
      let matchCount = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        if (matches) {
          matchCount += matches.length;
        }
      });

      if (matchCount > 0) {
        const confidence = Math.min(matchCount / (content.length / 30), 0.9);
        
        tags.push({
          id: `activity-${activity}`,
          name: this.getActivityDisplayName(activity),
          type: 'activity',
          confidence,
          color: this.getActivityColor(activity)
        });
      }
    });

    return tags.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * 生成天气标签
   */
  private static generateWeatherTags(weatherCondition: string): Tag[] {
    const tags: Tag[] = [];
    const lowerCondition = weatherCondition.toLowerCase();

    Object.entries(WEATHER_MAPPING).forEach(([weather, keywords]) => {
      const isMatch = keywords.some(keyword => 
        lowerCondition.includes(keyword) || keyword.includes(lowerCondition)
      );

      if (isMatch) {
        tags.push({
          id: `weather-${weather}`,
          name: this.getWeatherDisplayName(weather),
          type: 'weather',
          confidence: 0.9,
          color: this.getWeatherColor(weather)
        });
      }
    });

    return tags;
  }

  /**
   * 提取位置标签
   */
  private static extractLocationTags(content: string): Tag[] {
    const tags: Tag[] = [];
    // 简单的位置提取（可以根据需要扩展）
    const locationPatterns = [
      /在([\u4e00-\u9fa5]{2,10})/g,
      /去了([\u4e00-\u9fa5]{2,10})/g,
      /来到([\u4e00-\u9fa5]{2,10})/g
    ];

    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const location = match[1];
        if (location && location.length >= 2) {
          tags.push({
            id: `location-${location}`,
            name: location,
            type: 'location',
            confidence: 0.8,
            color: '#8B5CF6'
          });
        }
      }
    });

    // 去重
    const uniqueTags = tags.filter((tag, index, self) => 
      index === self.findIndex(t => t.name === tag.name)
    );

    return uniqueTags.slice(0, 2);
  }

  /**
   * 生成自定义标签（高频词汇）
   */
  private static generateCustomTags(content: string): Tag[] {
    // 提取高频词汇（排除常用词）
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个'];
    const words = content.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
                        .split(/\s+/)
                        .filter(word => word.length > 1 && !commonWords.includes(word));

    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // 找出高频词
    const sortedWords = Object.entries(wordCount)
                             .sort(([,a], [,b]) => b - a)
                             .slice(0, 5);

    return sortedWords.map(([word, count]) => ({
      id: `custom-${word}`,
      name: word,
      type: 'custom',
      confidence: Math.min(count / 10, 0.9),
      color: '#6B7280'
    }));
  }

  // 显示名称映射
  private static getEmotionDisplayName(emotion: string): string {
    const mapping: Record<string, string> = {
      happy: '😊 开心',
      sad: '😢 伤心',
      angry: '😠 愤怒',
      anxious: '😰 焦虑',
      calm: '😌 平静',
      excited: '🤩 兴奋',
      tired: '😴 疲惫',
      energetic: '💪 充满活力'
    };
    return mapping[emotion] || emotion;
  }

  private static getActivityDisplayName(activity: string): string {
    const mapping: Record<string, string> = {
      work: '💼 工作',
      study: '📚 学习',
      travel: '✈️ 旅行',
      exercise: '🏃 运动',
      social: '👥 社交',
      family: '👨‍👩‍👧‍👦 家庭',
      creative: '🎨 创作',
      rest: '🛋️ 休息'
    };
    return mapping[activity] || activity;
  }

  private static getWeatherDisplayName(weather: string): string {
    const mapping: Record<string, string> = {
      sunny: '☀️ 晴天',
      cloudy: '☁️ 阴天',
      rainy: '🌧️ 雨天',
      snowy: '❄️ 雪天',
      windy: '💨 大风',
      foggy: '🌫️ 雾天'
    };
    return mapping[weather] || weather;
  }

  // 颜色映射
  private static getEmotionColor(emotion: string): string {
    const mapping: Record<string, string> = {
      happy: '#F59E0B',
      sad: '#3B82F6',
      angry: '#EF4444',
      anxious: '#8B5CF6',
      calm: '#10B981',
      excited: '#EC4899',
      tired: '#6B7280',
      energetic: '#F97316'
    };
    return mapping[emotion] || '#6B7280';
  }

  private static getActivityColor(activity: string): string {
    const mapping: Record<string, string> = {
      work: '#3B82F6',
      study: '#8B5CF6',
      travel: '#F59E0B',
      exercise: '#10B981',
      social: '#EC4899',
      family: '#F97316',
      creative: '#8B5CF6',
      rest: '#6B7280'
    };
    return mapping[activity] || '#6B7280';
  }

  private static getWeatherColor(weather: string): string {
    const mapping: Record<string, string> = {
      sunny: '#F59E0B',
      cloudy: '#6B7280',
      rainy: '#3B82F6',
      snowy: '#0EA5E9',
      windy: '#A3A3A3',
      foggy: '#9CA3AF'
    };
    return mapping[weather] || '#6B7280';
  }
}