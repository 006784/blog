// 一键排版功能实现

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
