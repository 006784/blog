// 日记模板系统服务
// 提供预设模板、自定义模板和模板变量替换功能

export interface DiaryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'travel' | 'work' | 'study' | 'life' | 'health' | 'creative' | 'custom';
  content: string;
  placeholders: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue: string;
  required: boolean;
}

export interface AppliedTemplate {
  title: string;
  content: string;
  mood?: string;
  weather?: string;
  location?: string;
}

export class DiaryTemplateService {
  private static readonly DEFAULT_TEMPLATES: DiaryTemplate[] = [
    {
      id: 'travel-template',
      name: '旅行日记',
      description: '记录旅行中的见闻和感受',
      category: 'travel',
      content: `【旅行日记】{{location}}

日期：{{date}}
天气：{{weather}}

今天我来到了 {{location}}，这里的风景真是 {{feeling}}。
最令我印象深刻的是 {{highlight}}。
今天的收获是 {{insight}}。

心情：{{mood}}
今日感悟：{{reflection}}`,
      placeholders: ['location', 'date', 'weather', 'feeling', 'highlight', 'insight', 'mood', 'reflection'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    },
    {
      id: 'work-template',
      name: '工作日志',
      description: '记录工作中的重要事项和心得',
      category: 'work',
      content: `【工作日志】{{date}}

今日工作内容：
{{work_content}}

遇到的问题：
{{problems}}

解决方案：
{{solutions}}

明日计划：
{{next_day_plan}}

今日心情：{{mood}}
今日成就：{{achievement}}`,
      placeholders: ['date', 'work_content', 'problems', 'solutions', 'next_day_plan', 'mood', 'achievement'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    },
    {
      id: 'study-template',
      name: '学习笔记',
      description: '记录学习过程和知识点',
      category: 'study',
      content: `【学习笔记】{{subject}}

学习时间：{{date}} {{time}}
学习内容：{{topic}}

今日学到的新知识：
{{new_knowledge}}

遇到的难点：
{{difficulties}}

解决方法：
{{methods}}

复习计划：
{{review_plan}}

学习感受：{{feeling}}`,
      placeholders: ['subject', 'date', 'time', 'topic', 'new_knowledge', 'difficulties', 'methods', 'review_plan', 'feeling'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    },
    {
      id: 'daily-template',
      name: '日常日记',
      description: '记录日常生活点滴',
      category: 'life',
      content: `【日常日记】{{date}}

今日天气：{{weather}}
今日心情：{{mood}}

今日发生了什么：
{{events}}

今日的感想：
{{thoughts}}

今日感恩的事：
{{gratitude}}

今日小确幸：
{{joy}}`,
      placeholders: ['date', 'weather', 'mood', 'events', 'thoughts', 'gratitude', 'joy'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    },
    {
      id: 'health-template',
      name: '健康日记',
      description: '记录身体状况和健康习惯',
      category: 'health',
      content: `【健康日记】{{date}}

身体状况：{{physical_state}}
心情状态：{{mental_state}}

今日饮食：
{{diet}}

运动情况：
{{exercise}}

睡眠质量：
{{sleep_quality}}

用药情况：
{{medication}}

今日感受：
{{feelings}}

明日健康目标：
{{health_goals}}`,
      placeholders: ['date', 'physical_state', 'mental_state', 'diet', 'exercise', 'sleep_quality', 'medication', 'feelings', 'health_goals'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    }
  ];

  /**
   * 获取所有预设模板
   */
  static getDefaultTemplates(): DiaryTemplate[] {
    return this.DEFAULT_TEMPLATES;
  }

  /**
   * 获取特定分类的模板
   */
  static getTemplatesByCategory(category: string): DiaryTemplate[] {
    if (category === 'all') {
      return this.getDefaultTemplates();
    }
    return this.getDefaultTemplates().filter(template => template.category === category);
  }

  /**
   * 获取模板变量定义
   */
  static getTemplateVariables(template: DiaryTemplate): TemplateVariable[] {
    const variables: Record<string, TemplateVariable> = {
      date: {
        name: 'date',
        description: '当前日期',
        defaultValue: new Date().toISOString().split('T')[0],
        required: true
      },
      time: {
        name: 'time',
        description: '当前时间',
        defaultValue: new Date().toLocaleTimeString('zh-CN'),
        required: false
      },
      location: {
        name: 'location',
        description: '位置信息',
        defaultValue: '当前位置',
        required: false
      },
      weather: {
        name: 'weather',
        description: '天气状况',
        defaultValue: '晴',
        required: false
      },
      mood: {
        name: 'mood',
        description: '心情状态',
        defaultValue: '开心',
        required: false
      },
      feeling: {
        name: 'feeling',
        description: '感受',
        defaultValue: '美好',
        required: false
      },
      highlight: {
        name: 'highlight',
        description: '亮点',
        defaultValue: '有趣的经历',
        required: false
      },
      insight: {
        name: 'insight',
        description: '洞察',
        defaultValue: '新的认识',
        required: false
      },
      reflection: {
        name: 'reflection',
        description: '反思',
        defaultValue: '今日思考',
        required: false
      },
      events: {
        name: 'events',
        description: '事件',
        defaultValue: '今天发生的事',
        required: false
      },
      thoughts: {
        name: 'thoughts',
        description: '想法',
        defaultValue: '今日感想',
        required: false
      },
      gratitude: {
        name: 'gratitude',
        description: '感恩',
        defaultValue: '值得感恩的事',
        required: false
      },
      joy: {
        name: 'joy',
        description: '快乐',
        defaultValue: '小确幸',
        required: false
      }
    };

    return template.placeholders.map(placeholder => {
      return variables[placeholder] || {
        name: placeholder,
        description: `${placeholder}变量`,
        defaultValue: `[${placeholder}]`,
        required: false
      };
    });
  }

  /**
   * 应用模板到日记
   */
  static applyTemplate(template: DiaryTemplate, variables: Record<string, string>): AppliedTemplate {
    let content = template.content;
    const appliedVars: Record<string, string> = { ...variables };

    // 替换占位符
    template.placeholders.forEach(placeholder => {
      const value = appliedVars[placeholder] || `[${placeholder}]`;
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      content = content.replace(regex, value);
    });

    // 尝试从变量中提取标题
    let title = template.name;
    if (appliedVars.location) {
      title = `${template.name} - ${appliedVars.location}`;
    } else if (appliedVars.subject) {
      title = `${template.name} - ${appliedVars.subject}`;
    }

    return {
      title,
      content,
      mood: appliedVars.mood,
      weather: appliedVars.weather,
      location: appliedVars.location
    };
  }

  /**
   * 创建自定义模板
   */
  static createCustomTemplate(name: string, content: string, category: string = 'custom'): DiaryTemplate {
    // 提取占位符
    const placeholders = this.extractPlaceholders(content);

    return {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: `自定义模板 - ${name}`,
      category: category as any,
      content,
      placeholders,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false
    };
  }

  /**
   * 提取内容中的占位符
   */
  private static extractPlaceholders(content: string): string[] {
    const regex = /{{(\w+)}}/g;
    const matches = [...content.matchAll(regex)];
    const placeholders = new Set<string>();

    matches.forEach(match => {
      if (match[1]) {
        placeholders.add(match[1]);
      }
    });

    return Array.from(placeholders);
  }

  /**
   * 验证模板内容
   */
  static validateTemplateContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content.trim()) {
      errors.push('模板内容不能为空');
    }

    if (content.length > 10000) {
      errors.push('模板内容不能超过10000个字符');
    }

    // 检查占位符格式
    const invalidPlaceholders = content.match(/{{[^{}]*}}/g)?.filter(p => !/^{{\w+}}$/.test(p));
    if (invalidPlaceholders && invalidPlaceholders.length > 0) {
      errors.push(`发现格式错误的占位符: ${invalidPlaceholders.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 保存自定义模板到本地存储
   */
  static saveCustomTemplate(template: DiaryTemplate): void {
    if (typeof window !== 'undefined') {
      const templates = this.loadCustomTemplates();
      templates.push(template);
      localStorage.setItem('diary-custom-templates', JSON.stringify(templates));
    }
  }

  /**
   * 加载自定义模板
   */
  static loadCustomTemplates(): DiaryTemplate[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('diary-custom-templates');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }));
      }
    } catch (error) {
      console.error('加载自定义模板失败:', error);
    }

    return [];
  }

  /**
   * 删除自定义模板
   */
  static deleteCustomTemplate(templateId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const templates = this.loadCustomTemplates();
      const filtered = templates.filter(t => t.id !== templateId);
      localStorage.setItem('diary-custom-templates', JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('删除自定义模板失败:', error);
      return false;
    }
  }

  /**
   * 更新自定义模板
   */
  static updateCustomTemplate(updatedTemplate: DiaryTemplate): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const templates = this.loadCustomTemplates();
      const index = templates.findIndex(t => t.id === updatedTemplate.id);
      if (index !== -1) {
        templates[index] = { ...updatedTemplate, updatedAt: new Date() };
        localStorage.setItem('diary-custom-templates', JSON.stringify(templates));
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新自定义模板失败:', error);
      return false;
    }
  }

  /**
   * 获取所有模板（包括预设和自定义）
   */
  static getAllTemplates(): DiaryTemplate[] {
    const defaultTemplates = this.getDefaultTemplates();
    const customTemplates = this.loadCustomTemplates();
    return [...defaultTemplates, ...customTemplates];
  }
}