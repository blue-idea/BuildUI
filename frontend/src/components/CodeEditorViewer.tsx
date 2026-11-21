import React, { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { DiagnosticItem } from '../services/wailsBridge';

export interface CodeEditorViewerProps {
  code: string;
  filePath?: string;
  language?: string;
  highlightedLine?: number | null;
  diagnostics?: DiagnosticItem[];
  onLineClick?: (lineNumber: number) => void;
  className?: string;
}

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'tag' | 'attribute' | 'punctuation' | 'plain';
  value: string;
}

// 常见编程语言语法关键字定义
const KEYWORDS = new Set([
  'import', 'export', 'from', 'as', 'default',
  'const', 'let', 'var', 'function', 'return',
  'class', 'extends', 'implements', 'interface', 'type',
  'if', 'else', 'switch', 'case', 'break', 'continue',
  'for', 'while', 'do', 'try', 'catch', 'finally', 'throw',
  'async', 'await', 'new', 'typeof', 'instanceof', 'void', 'delete',
  'true', 'false', 'null', 'undefined',
  'package', 'func', 'struct', 'select', 'defer', 'go',
]);

/**
 * 轻量级代码分词算法：将单行代码解析为带有语义类型的 Token 序列
 */
function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  // 正则词法规则（优先级从高到低）
  const rules: Array<{ type: Token['type']; regex: RegExp }> = [
    // 单行注释
    { type: 'comment', regex: /^(\/\/.*|\/\*.*?\*\/)/ },
    // 双引号、单引号或反引号字符串
    { type: 'string', regex: /^("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/ },
    // JSX 闭合或起始标签名，例如 </div> 或 <div 或 <Component
    { type: 'tag', regex: /^(<\/?\b[a-zA-Z0-9_\.]+\b)/ },
    // JSX 属性名，例如 className=
    { type: 'attribute', regex: /^(\b[a-zA-Z_][a-zA-Z0-9_\-]*\b(?==))/ },
    // 数字字面量
    { type: 'number', regex: /^(\b\d+(\.\d+)?\b|0x[0-9a-fA-F]+)/ },
    // 标点符号与运算符
    { type: 'punctuation', regex: /^([{}()\[\].,:;=+\-*\/%&|^!<>?]+)/ },
    // 标识符（单词）
    { type: 'plain', regex: /^(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/ },
    // 空白符
    { type: 'plain', regex: /^(\s+)/ },
    // 其他任意非空白字符
    { type: 'plain', regex: /^([^\s\w{}()\[\].,:;=+\-*\/%&|^!<>?"'`]+)/ },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const rule of rules) {
      const match = rule.regex.exec(remaining);
      if (match && match[0].length > 0) {
        const value = match[0];
        let tokenType = rule.type;

        // 如果是 plain 标识符，检查是否为关键字
        if (tokenType === 'plain' && KEYWORDS.has(value)) {
          tokenType = 'keyword';
        }

        tokens.push({ type: tokenType, value });
        remaining = remaining.slice(value.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push({ type: 'plain', value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

/**
 * 针对不同 Token 类型返回高亮样式类名（支持深浅主题自适应）
 */
function getTokenClassName(type: Token['type']): string {
  switch (type) {
    case 'keyword':
      return 'text-purple-600 dark:text-purple-400 font-medium';
    case 'string':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'comment':
      return 'text-slate-400 dark:text-zinc-500 italic';
    case 'tag':
      return 'text-sky-600 dark:text-sky-400 font-medium';
    case 'attribute':
      return 'text-amber-600 dark:text-amber-300';
    case 'number':
      return 'text-orange-600 dark:text-amber-400';
    case 'punctuation':
      return 'text-slate-500 dark:text-zinc-400';
    case 'plain':
    default:
      return 'text-slate-800 dark:text-zinc-200';
  }
}

export const CodeEditorViewer: React.FC<CodeEditorViewerProps> = ({
  code,
  filePath = '',
  highlightedLine = null,
  diagnostics = [],
  onLineClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = (code ?? '').split('\n');
  const lineCountDigits = Math.max(2, String(lines.length).length);

  // 筛选出属于当前文件且行号有效的诊断列表
  const currentFileDiagnostics = diagnostics.filter((diag) => {
    if (!diag || !diag.line) return false;
    if (!diag.file || !filePath) return true;
    return diag.file === filePath || filePath.endsWith(diag.file) || diag.file.endsWith(filePath);
  });

  // 按行建立诊断映射
  const diagnosticsByLine = new Map<number, DiagnosticItem[]>();
  for (const diag of currentFileDiagnostics) {
    const list = diagnosticsByLine.get(diag.line) || [];
    list.push(diag);
    diagnosticsByLine.set(diag.line, list);
  }

  // 监听 highlightedLine 变化，实现平滑滚动至视口居中
  useEffect(() => {
    if (!highlightedLine || highlightedLine < 1 || highlightedLine > lines.length) return;
    const targetElement = containerRef.current?.querySelector(
      `[data-line="${highlightedLine}"]`
    );
    if (targetElement && typeof targetElement.scrollIntoView === 'function') {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedLine, lines.length]);

  return (
    <div
      ref={containerRef}
      data-testid="code-editor-viewer"
      className={`relative w-full h-full overflow-auto font-mono text-xs select-text bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 transition-colors ${className}`}
    >
      <div className="min-w-full inline-block py-2">
        {lines.map((lineText, idx) => {
          const lineNumber = idx + 1;
          const isHighlighted = highlightedLine === lineNumber;
          const lineDiagnostics = diagnosticsByLine.get(lineNumber) || [];
          const hasError = lineDiagnostics.some((d) => d.severity === 'error');
          const hasWarning = lineDiagnostics.some((d) => d.severity === 'warning');

          const tokens = tokenizeLine(lineText);

          return (
            <div
              key={lineNumber}
              id={`code-line-${lineNumber}`}
              data-testid={`code-line-${lineNumber}`}
              data-line={lineNumber}
              data-highlighted-line={isHighlighted ? 'true' : undefined}
              data-has-error={hasError ? 'true' : undefined}
              className={`group flex items-start transition-colors leading-6 ${
                isHighlighted
                  ? 'bg-purple-100/70 border-l-2 border-purple-500 dark:bg-purple-950/70 dark:border-purple-400'
                  : hasError
                  ? 'bg-rose-50/80 border-l-2 border-rose-500 dark:bg-rose-950/30 dark:border-rose-500'
                  : hasWarning
                  ? 'bg-amber-50/70 border-l-2 border-amber-500 dark:bg-amber-950/20 dark:border-amber-500'
                  : 'hover:bg-slate-100/70 dark:hover:bg-zinc-900/40 border-l-2 border-transparent'
              }`}
            >
              {/* 行号栏（Gutter，适配明暗主题） */}
              <div
                data-testid={`code-line-number-${lineNumber}`}
                onClick={() => onLineClick?.(lineNumber)}
                className={`shrink-0 flex items-center justify-end gap-1 px-3 py-0 select-none cursor-pointer border-r border-slate-200 dark:border-zinc-800 text-right transition-colors ${
                  isHighlighted
                    ? 'text-purple-700 dark:text-purple-300 font-semibold bg-purple-100/60 dark:bg-purple-900/30'
                    : hasError
                    ? 'text-rose-600 dark:text-rose-400 font-semibold bg-rose-50/60 dark:bg-rose-950/20'
                    : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-400 bg-slate-50/60 dark:bg-zinc-900/30'
                }`}
                style={{ width: `${Math.max(48, lineCountDigits * 10 + 28)}px` }}
              >
                {/* 错误或警告图标指示 */}
                {hasError && (
                  <span data-testid={`line-error-marker-${lineNumber}`} title={lineDiagnostics[0]?.message}>
                    <AlertCircle className="w-3 h-3 text-rose-500 dark:text-rose-400 inline" />
                  </span>
                )}
                {!hasError && hasWarning && (
                  <span data-testid={`line-error-marker-${lineNumber}`} title={lineDiagnostics[0]?.message}>
                    <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400 inline" />
                  </span>
                )}
                <span>{lineNumber}</span>
              </div>

              {/* 代码行高亮 Token 展示与无障碍文本 */}
              <div className="flex-1 px-3 py-0 whitespace-pre overflow-x-visible">
                {/* 供辅助设备与无障碍语义查询的整行完整文本 */}
                <span className="sr-only">{lineText}</span>

                {/* 视觉呈现的分词高亮 Token 序列 */}
                <span aria-hidden="true">
                  {tokens.length === 0 ? (
                    <span>&nbsp;</span>
                  ) : (
                    tokens.map((token, tIdx) => (
                      <span
                        key={tIdx}
                        data-testid={`token-${token.type}`}
                        className={getTokenClassName(token.type)}
                      >
                        {token.value}
                      </span>
                    ))
                  )}
                </span>

                {/* 行内错误提示信息条 */}
                {lineDiagnostics.length > 0 && (
                  <div className="mt-1 mb-1 px-2.5 py-1 rounded bg-rose-50 border border-rose-200 dark:bg-rose-950/80 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200 flex items-center gap-1.5 shadow-2xs">
                    <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="font-sans font-medium select-text">
                      {lineDiagnostics.map((d) => d.message).join(' | ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
