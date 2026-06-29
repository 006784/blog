// 一键排版功能实现

// U+200B 零宽空格：对渲染无影响，但让 CommonMark 重新判定右侧贴近规则
const ZWS = '​';

/**
 * 修复两类 AI 生成内容里常见的加粗失效问题，跳过代码块/行内代码：
 *
 * 1. 「** 文字 **」两侧带空格——CommonMark 不识别，去掉内侧空格即可。
 *
 * 2. 「**术语（English）**接着中文」——闭合 ** 前是全角标点（如 ）），
 *    后面紧跟中文字（非空白非标点），CommonMark 判定为非右侧贴近，
 *    在标点与闭合 ** 之间插入零宽空格使其可被识别。
 */
export function normalizeMarkdownBold(content: string): string {
  return content
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((segment, i) => {
      if (i % 2 === 1) return segment;
      // 规则1：去掉 ** 内侧空格
      let fixed = segment.replace(/\*\*[ \t]+([^\n*]+?)[ \t]+\*\*/g, '**$1**');
      // 规则2：在「标点结尾 + ** + 非空白非标点」处插入零宽空格
      fixed = fixed.replace(
        /\*\*([^\n*]+?)\*\*(?=[^\s\p{P}\p{S}])/gu,
        (match, inner) => (/[\p{P}\p{S}]$/u.test(inner) ? `**${inner}${ZWS}**` : match),
      );
      return fixed;
    })
    .join('');
}

/**
 * 对Markdown内容进行自动格式化
 * @param content 原始Markdown内容
 * @returns 格式化后的Markdown内容
 */
export function autoFormatContent(content: string): string {
  let formatted = content;
  
  // 1. 统一换行符
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 2. 清理多余空行（超过2个连续空行替换为2个）
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // 3. 标题前后添加空行
  formatted = formatted.replace(/^(#{1,6}.*$)/gm, '\n\n$1\n');
  
  // 4. 格式化列表项（确保列表项之间有一致的间距）
  formatted = formatted.replace(/^(\s*[-*+]\s.+)$/gm, '\n$1');
  formatted = formatted.replace(/^(\s*\d+\.\s.+)$/gm, '\n$1');
  
  // 5. 为引用块添加空行
  formatted = formatted.replace(/(\n> .*)/g, '\n$1\n');
  
  // 6. 清理多余空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // 7. 清理开头和结尾的空行
  formatted = formatted.trim();
  
  // 8. 确保文档末尾有一个换行符
  formatted = formatted + '\n';
  
  return formatted;
}
