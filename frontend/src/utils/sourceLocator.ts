import { CodeRegion } from '../types/inspect';

export interface LocateOptions {
  sourceCode: string;
  filePath: string;
  line?: number;
  column?: number;
  tagName?: string;
  className?: string;
  textSnippet?: string;
}

/**
 * 根据源文件内容和点选元素的位置信息，默认定位外层容器的完整起始与闭合行范围，并提取代码片段
 */
export function locateCodeRegion(options: LocateOptions): CodeRegion {
  const { sourceCode, filePath, line, tagName, textSnippet } = options;

  if (!sourceCode || !sourceCode.trim()) {
    return {
      filePath,
      startLine: 1,
      endLine: 1,
      codeSnippet: '',
      found: false,
      message: 'Source code is empty',
    };
  }

  const lines = sourceCode.split(/\r?\n/);
  const totalLines = lines.length;

  let targetStartLine = line;

  // 1. 若没有有效行号，基于 tagName 与 textSnippet 搜索行号
  if (!targetStartLine || targetStartLine < 1 || targetStartLine > totalLines) {
    if (tagName) {
      const lowerTag = tagName.toLowerCase();
      for (let i = 0; i < totalLines; i++) {
        const lineText = lines[i];
        if (lineText.toLowerCase().includes(`<${lowerTag}`)) {
          if (!textSnippet || lineText.includes(textSnippet)) {
            targetStartLine = i + 1;
            break;
          }
        }
      }
    }
  }

  // 若仍未找到任何行号，降级返回首部代码
  if (!targetStartLine || targetStartLine < 1 || targetStartLine > totalLines) {
    return {
      filePath,
      startLine: 1,
      endLine: Math.min(10, totalLines),
      codeSnippet: lines.slice(0, Math.min(10, totalLines)).join('\n'),
      found: false,
      message: 'Could not resolve matching line in source',
    };
  }

  // 2. 向上回溯起始行：若 targetStartLine 处不是容器开标签，向上找到容器的开标签行
  let startLine = targetStartLine;
  const targetTagLower = tagName?.toLowerCase();

  if (targetTagLower) {
    let foundTagStart = false;
    for (let i = targetStartLine - 1; i >= 0; i--) {
      const lineText = lines[i];
      const tagRegex = new RegExp(`<${targetTagLower}(\\s|>|/|$)`, 'i');
      if (tagRegex.test(lineText)) {
        startLine = i + 1;
        foundTagStart = true;
        break;
      }
      if (targetStartLine - 1 - i > 25) break;
    }
    if (!foundTagStart) {
      startLine = targetStartLine;
    }
  } else {
    for (let i = targetStartLine - 1; i >= 0; i--) {
      const lineText = lines[i];
      if (/<\s*[A-Za-z0-9_.-]+(\s|>|\/|$)/.test(lineText)) {
        startLine = i + 1;
        break;
      }
      if (targetStartLine - 1 - i > 15) break;
    }
  }

  // 3. 提取实际开标签的标签名
  const startLineText = lines[startLine - 1];
  let actualTag = targetTagLower;
  const tagMatch = startLineText.match(/<\s*([A-Za-z0-9_.-]+)/);
  if (tagMatch) {
    actualTag = tagMatch[1].toLowerCase();
  }

  let endLine = startLine;

  if (actualTag) {
    // 4. 检查是否自闭合（在遇到 > 之前先遇到 />）
    let isSelfClosing = false;
    let combinedTagHeader = '';
    for (let i = startLine - 1; i < totalLines; i++) {
      combinedTagHeader += ' ' + lines[i];
      if (combinedTagHeader.includes('/>')) {
        endLine = i + 1;
        isSelfClosing = true;
        break;
      }
      if (combinedTagHeader.includes('>')) {
        break;
      }
    }

    if (!isSelfClosing) {
      // 5. 完整外层容器标签匹配栈（寻找对应的闭合标签 </actualTag>）
      let depth = 0;
      const openTagRegex = new RegExp(`<${actualTag}(\\s|>|$)`, 'gi');
      const closeTagRegex = new RegExp(`</${actualTag}>`, 'gi');
      const selfCloseTagRegex = new RegExp(`<${actualTag}[^>]*/>`, 'gi');

      for (let i = startLine - 1; i < totalLines; i++) {
        const lineContent = lines[i];

        const openMatches = lineContent.match(openTagRegex);
        const openCount = openMatches ? openMatches.length : 0;

        const selfCloseMatches = lineContent.match(selfCloseTagRegex);
        const selfCloseCount = selfCloseMatches ? selfCloseMatches.length : 0;

        const closeMatches = lineContent.match(closeTagRegex);
        const closeCount = closeMatches ? closeMatches.length : 0;

        depth += openCount - selfCloseCount - closeCount;

        if (depth <= 0 && i >= startLine - 1) {
          endLine = i + 1;
          break;
        }
      }

      if (depth > 0) {
        endLine = Math.min(startLine + 4, totalLines);
      }
    }
  }

  const codeSnippet = lines.slice(startLine - 1, endLine).join('\n');

  return {
    filePath,
    startLine,
    endLine,
    codeSnippet,
    found: true,
  };
}

export default locateCodeRegion;
