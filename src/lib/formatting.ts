// 文本格式化工具函数

/**
 * 一键排版功能
 * @param content 原始内容
 * @returns 格式化后的内容
 */
export function autoFormatContent(content: string): string {
  let formatted = content;
  
  // 1. 统一换行符
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 2. 清理多余空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // 3. 标题后加空行
  formatted = formatted.replace(/(#{1,6}[^\n]*)/g, '$1\n');
  
  // 4. 段落后加空行
  
  return formatted;
}  // 4. 段落后加空行
  formatted = formatted.replace(/([^\n])(\n)([^\n#-`>])/g, '$1\n\n$3');
  
  return formatted;
};
