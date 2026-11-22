import React, { useState, useRef } from 'react';
import { ExtractedStyle } from '../types/style';
import { extractStyleFromReference } from '../utils/styleExtractor';
import { Sparkles, Copy, Check, Upload, Save } from 'lucide-react';

export interface StyleExtractorProps {
  onSaveTemplate?: (style: ExtractedStyle) => void;
}

export const StyleExtractor: React.FC<StyleExtractorProps> = ({ onSaveTemplate }) => {
  const [referenceText, setReferenceText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedStyle | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 执行风格提取
  const handleExtract = () => {
    const result = extractStyleFromReference(referenceText, Boolean(imagePreview));
    setExtractedResult(result);
    setIsSaved(false);
  };

  // 复制 Prompt
  const handleCopyPrompt = () => {
    if (extractedResult?.designPrompt) {
      navigator.clipboard.writeText(extractedResult.designPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // 保存为风格模版
  const handleSave = () => {
    if (extractedResult) {
      onSaveTemplate?.(extractedResult);
      setIsSaved(true);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-2">
      {/* 参照物输入区域 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col gap-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Reference Input</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Provide a brand counterpart name or upload a screenshot to extract design tokens and prompts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 文本输入 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Reference Brand or Keyword
            </label>
            <input
              type="text"
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="e.g. Linear, Stripe, Apple, Notion, Raycast..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* 图片上传拖拽区 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Reference Screenshot (Optional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-18 border border-dashed border-slate-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors px-4 bg-slate-50/50 dark:bg-zinc-800/40"
            >
              {imagePreview ? (
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-zinc-700"
                  />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Change Image
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Upload Reference Image</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 提取按钮 */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleExtract}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extract Style & Prompt</span>
          </button>
        </div>
      </div>

      {/* 提取结果与预览展示 */}
      {extractedResult && (
        <div className="space-y-6 animate-fade-in">
          {/* 色板与设计规范卡片 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {extractedResult.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  {extractedResult.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 操作按钮：保存为模版 / 复制 Prompt */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy Prompt'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-2xs ${
                    isSaved
                      ? 'bg-emerald-600 opacity-90 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer'
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaved ? 'Saved to Templates' : 'Save as Style Template'}</span>
                </button>
              </div>
            </div>

            {/* 调色盘色块矩阵 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Primary</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-black/5"
                  style={{ backgroundColor: extractedResult.palette.primary }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.primary}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Background</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-700"
                  style={{ backgroundColor: extractedResult.palette.background }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.background}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Surface</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-700"
                  style={{ backgroundColor: extractedResult.palette.surface }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.surface}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Text</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-black/5"
                  style={{ backgroundColor: extractedResult.palette.text }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.text}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Border</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-black/5"
                  style={{ backgroundColor: extractedResult.palette.border }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.border}
                </span>
              </div>
            </div>
          </div>

          {/* 实时 UI 效果模拟预览 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live UI Preview
            </h4>

            <div
              className="p-6 rounded-2xl border transition-all"
              style={{
                backgroundColor: extractedResult.palette.background,
                borderColor: extractedResult.palette.border,
              }}
            >
              <div
                className="p-5 rounded-xl border flex flex-col gap-4 shadow-xs"
                style={{
                  backgroundColor: extractedResult.palette.surface,
                  borderColor: extractedResult.palette.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: extractedResult.palette.primary }}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{ color: extractedResult.palette.text }}
                    >
                      Card Title Component
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${extractedResult.palette.primary}20`,
                      color: extractedResult.palette.primary,
                    }}
                  >
                    Active Badge
                  </span>
                </div>

                <p
                  className="text-xs leading-relaxed opacity-80"
                  style={{ color: extractedResult.palette.text }}
                >
                  This is a live mock rendering of how components behave with the extracted design tokens and elevation.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs"
                    style={{ backgroundColor: extractedResult.palette.primary }}
                  >
                    Action Button
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 生成的 Design Prompt 纯文本代码块 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Design System Prompt
            </h4>
            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono leading-relaxed text-slate-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
              {extractedResult.designPrompt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
