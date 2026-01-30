// AI翻译服务
import { TranslationResult } from '../../types/news';
import { logger } from '../../logger';

export class TranslationService {
  private static readonly DEEPL_API_KEY = process.env.DEEPL_API_KEY;
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  /**
   * 翻译文本为中文
   */
  static async translateToChinese(text: string, sourceLang?: string): Promise<TranslationResult> {
    // 如果已经是中文，直接返回
    if (this.isChinese(text)) {
      return {
        translatedText: text,
        detectedLanguage: 'zh',
        confidence: 1,
        translationModel: 'none'
      };
    }

    // 优先使用DeepL API（质量更好）
    if (this.DEEPL_API_KEY) {
      try {
        return await this.translateWithDeepL(text, sourceLang);
      } catch (error) {
        logger.warn('DeepL翻译失败，尝试OpenAI', { error });
      }
    }

    // 回退到OpenAI
    if (this.OPENAI_API_KEY) {
      try {
        return await this.translateWithOpenAI(text, sourceLang);
      } catch (error) {
        logger.error('OpenAI翻译也失败', { error });
      }
    }

    // 最后的回退方案：使用简单的关键词映射
    return this.simpleTranslateFallback(text);
  }

  /**
   * 使用DeepL API翻译
   */
  private static async translateWithDeepL(text: string, sourceLang?: string): Promise<TranslationResult> {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.DEEPL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: [text],
        target_lang: 'ZH',
        source_lang: sourceLang,
        preserve_formatting: true
      })
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      translatedText: data.translations[0].text,
      detectedLanguage: data.translations[0].detected_source_language.toLowerCase(),
      confidence: 0.95,
      translationModel: 'deepl'
    };
  }

  /**
   * 使用OpenAI API翻译
   */
  private static async translateWithOpenAI(text: string, sourceLang?: string): Promise<TranslationResult> {
    const prompt = `请将以下${sourceLang ? sourceLang + '语' : '外文'}内容翻译成中文，保持原文的意思和语气：
    
${text}

翻译结果：`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的翻译专家，请将用户提供外文内容准确翻译成中文，保持原文的语义和风格。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    return {
      translatedText,
      detectedLanguage: sourceLang || 'auto',
      confidence: 0.9,
      translationModel: 'openai'
    };
  }

  /**
   * 简单翻译回退方案
   */
  private static simpleTranslateFallback(text: string): TranslationResult {
    // 简单的关键词替换（仅作演示）
    const translations: Record<string, string> = {
      'technology': '科技',
      'business': '商业',
      'politics': '政治',
      'international': '国际',
      'science': '科学',
      'entertainment': '娱乐',
      'sports': '体育',
      'economy': '经济',
      'market': '市场',
      'innovation': '创新',
      'digital': '数字',
      'global': '全球',
      'china': '中国',
      'america': '美国',
      'europe': '欧洲'
    };

    let translatedText = text.toLowerCase();
    Object.entries(translations).forEach(([english, chinese]) => {
      translatedText = translatedText.replace(new RegExp(english, 'gi'), chinese);
    });

    return {
      translatedText: text, // 保持原样，因为简单翻译质量不高
      detectedLanguage: 'auto',
      confidence: 0.3,
      translationModel: 'fallback'
    };
  }

  /**
   * 检测文本是否为中文
   */
  private static isChinese(text: string): boolean {
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(text);
  }

  /**
   * 批量翻译
   */
  static async batchTranslate(texts: string[], sourceLang?: string): Promise<TranslationResult[]> {
    return Promise.all(
      texts.map(text => this.translateToChinese(text, sourceLang))
    );
  }
}