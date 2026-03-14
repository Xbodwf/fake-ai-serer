/**
 * 复制文本到剪贴板
 * 支持 HTTPS 和非 HTTPS 环境
 */
export function copyToClipboard(text: string): Promise<void> {
  // 优先使用现代 Clipboard API（需要 HTTPS 或 localhost）
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback 到 document.execCommand（支持非 HTTPS 环境）
  return new Promise<void>((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        resolve();
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (err) {
      document.body.removeChild(textArea);
      reject(err);
    }
  });
}
