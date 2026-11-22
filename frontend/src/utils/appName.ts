/**
 * 根据用户输入的提示词或选项，生成合法、唯一且安全的应用名称
 *
 * @param input 用户输入的提示词、需求描述或初始名称
 * @param existingNames 当前已有项目的名称列表（用于避免重名冲突）
 * @param fallbackPrefix 备选前缀，默认为 'App'
 * @returns 经过清洗且安全的项目名称
 */
export function generateSafeAppName(
  input?: string,
  existingNames: string[] = [],
  fallbackPrefix = 'App'
): string {
  const fallback = `${fallbackPrefix}-${Date.now().toString().slice(-6)}`;
  if (!input) return fallback;

  // 1. 获取第一行内容，去除多余换行
  const firstLine = input.split(/[\r\n]+/)[0]?.trim() || '';

  // 2. 去除文件名与路径中的非法字符: \ / : * ? " < > | 以及特殊符号
  const cleaned = firstLine.replace(/[\\/:*?"<>|•`~#$%^&*+=[\]{}()]/g, ' ').trim();

  // 3. 截断长度在 1-40 字符之内
  const baseName = cleaned.slice(0, 40).trim();
  if (!baseName) return fallback;

  // 4. 检查是否与已有项目重名，若重名则附加时间戳后缀避免目录冲突
  const isDuplicate = existingNames.some(
    (name) => name.trim().toLowerCase() === baseName.toLowerCase()
  );
  if (isDuplicate) {
    return `${baseName}-${Date.now().toString().slice(-4)}`;
  }

  return baseName;
}
