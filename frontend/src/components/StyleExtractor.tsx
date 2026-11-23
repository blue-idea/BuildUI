import React, { useState, useRef } from 'react';
import { ExtractedStyle } from '../types/style';
import { extractStyleFromReference } from '../utils/styleExtractor';
import { Sparkles, Upload, Copy, Check, Save, Loader2, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { ModelSelector } from './ModelSelector';
import { parseConfiguredProviders } from '../config/providers';

export interface StyleExtractorProps {
  onSaveTemplate: (extracted: ExtractedStyle) => void;
  settings?: Record<string, string>;
  onOpenSettings?: () => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export const StyleExtractor: React.FC<StyleExtractorProps> = ({
  onSaveTemplate,
  settings,
  onOpenSettings,
  selectedModel,
  onSelectModel,
}) => {
  const { t } = useI18n();
  const [referenceInput, setReferenceInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedStyle | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [internalSelectedModel, setInternalSelectedModel] = useState(selectedModel || 'auto');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片附件上传与本地预览
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setImagePreview(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 触发风格提取计算
  const handleExtract = async () => {
    if (!referenceInput.trim() && !imagePreview) return;
    setIsExtracting(true);
    setExtractError(null);
    setIsSaved(false);
    setIsCopied(false);

    const activeModel = selectedModel ?? internalSelectedModel;
    let reqProvider: string | undefined = undefined;
    let reqModel: string | undefined = undefined;
    if (activeModel && activeModel !== 'auto') {
      if (activeModel.startsWith('provider:')) {
        reqProvider = activeModel.replace('provider:', '');
        reqModel =
          settings?.[`llm.providers.${reqProvider}.model`] ||
          parseConfiguredProviders(settings || {}).find((p) => p.id === reqProvider)?.model;
      } else if (activeModel === 'configured') {
        reqProvider = settings?.['llm.provider'];
        reqModel = settings?.['llm.model'];
      }
    }

    try {
      let result: ExtractedStyle;
      const api = typeof window !== 'undefined' ? window.go?.main?.App : undefined;
      if (api && typeof api.ExtractStyle === 'function') {
        const dto = await api.ExtractStyle({
          reference: referenceInput.trim(),
          imageBase64: imagePreview || undefined,
          provider: reqProvider,
          model: reqModel,
        });
        result = {
          id: dto.id || `style-${Date.now()}`,
          name: dto.name,
          referenceSource: dto.referenceSource || referenceInput.trim() || 'Uploaded Screenshot',
          palette: {
            primary: dto.palette.primary,
            accent: dto.palette.accent,
            background: dto.palette.background,
            surface: dto.palette.surface,
            text: dto.palette.text,
            textMuted: dto.palette.textMuted,
            border: dto.palette.border,
          },
          borderRadius: dto.borderRadius || 'xl',
          typography: dto.typography || 'Inter, system-ui, sans-serif',
          tags: dto.tags || ['AI Extracted'],
          stylePrompt: dto.stylePrompt,
          designPrompt: dto.designPrompt || dto.stylePrompt,
          createdAt: dto.createdAt || new Date().toISOString(),
        };
      } else {
        result = extractStyleFromReference(referenceInput, Boolean(imagePreview));
      }
      setExtractedResult(result);
    } catch (err: any) {
      console.error('ExtractStyle failed:', err);
      const errMsg = err?.message || String(err) || 'Extraction failed.';
      setExtractError(errMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  // 复制生成的 AI 提示词
  const handleCopyPrompt = () => {
    const promptText = extractedResult?.stylePrompt || extractedResult?.designPrompt;
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 保存为风格模版
  const handleSave = () => {
    if (!extractedResult || isSaved) return;
    onSaveTemplate(extractedResult);
    setIsSaved(true);
  };

  return (
    <div data-testid="style-extractor-component" className="space-y-6">
      {/* 参照物输入表单卡片 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t('stylePage.refInputTitle')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('stylePage.refInputDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t('stylePage.modelSelectLabel')}
            </span>
            <ModelSelector
              value={selectedModel ?? internalSelectedModel}
              onChange={(val) => {
                setInternalSelectedModel(val);
                onSelectModel?.(val);
              }}
              settings={settings}
              onOpenSettings={onOpenSettings}
              disabled={isExtracting}
              placement="bottom"
            />
          </div>
        </div>

        {/* 错误提示横幅 */}
        {extractError && (
          <div
            data-testid="style-extract-error-banner"
            className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{extractError}</span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] shrink-0 cursor-pointer transition-colors"
              >
                {t('stylePage.btnGoSettings')}
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* 品牌/参照物文本输入 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {t('stylePage.labelBrand')}
            </label>
            <input
              type="text"
              value={referenceInput}
              onChange={(e) => setReferenceInput(e.target.value)}
              disabled={isExtracting}
              placeholder={t('stylePage.brandPlaceholder')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* 图片上传拖拽区 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {t('stylePage.labelScreenshot')}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              disabled={isExtracting}
              onChange={handleImageUpload}
              className="hidden"
            />
            <div
              onClick={() => {
                if (!isExtracting) fileInputRef.current?.click();
              }}
              className={`w-full h-18 border border-dashed border-slate-200 dark:border-zinc-700 rounded-xl flex items-center justify-center gap-2 transition-colors px-4 bg-slate-50/50 dark:bg-zinc-800/40 ${
                isExtracting
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer'
              }`}
            >
              {imagePreview ? (
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-zinc-700"
                  />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {t('stylePage.btnChangeImage')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>{t('stylePage.btnUploadImage')}</span>
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
            disabled={isExtracting || (!referenceInput.trim() && !imagePreview)}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all ${
              isExtracting
                ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed opacity-80'
                : !referenceInput.trim() && !imagePreview
                ? 'bg-slate-300 dark:bg-zinc-700 cursor-not-allowed opacity-70'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer'
            }`}
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('stylePage.btnExtracting')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('stylePage.btnExtract')}</span>
              </>
            )}
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
                  <span>{isCopied ? t('stylePage.btnCopied') : t('stylePage.btnCopyPrompt')}</span>
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
                  <span>{isSaved ? t('stylePage.btnSaved') : t('stylePage.btnSaveTemplate')}</span>
                </button>
              </div>
            </div>

            {/* 调色盘色块矩阵 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('stylePage.palettePrimary')}</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-black/5"
                  style={{ backgroundColor: extractedResult.palette.primary }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.primary}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('stylePage.paletteBackground')}</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-700"
                  style={{ backgroundColor: extractedResult.palette.background }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.background}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('stylePage.paletteSurface')}</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-700"
                  style={{ backgroundColor: extractedResult.palette.surface }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.surface}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('stylePage.paletteText')}</span>
                <div
                  className="h-8 rounded-xl shadow-xs border border-black/5"
                  style={{ backgroundColor: extractedResult.palette.text }}
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                  {extractedResult.palette.text}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('stylePage.paletteBorder')}</span>
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
              {t('stylePage.livePreviewTitle')}
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
                      {t('stylePage.previewCardTitle')}
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${extractedResult.palette.primary}20`,
                      color: extractedResult.palette.primary,
                    }}
                  >
                    {t('stylePage.previewBadge')}
                  </span>
                </div>

                <p
                  className="text-xs leading-relaxed opacity-80"
                  style={{ color: extractedResult.palette.text }}
                >
                  {t('stylePage.previewDesc')}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs"
                    style={{ backgroundColor: extractedResult.palette.primary }}
                  >
                    {t('stylePage.previewActionBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 生成的 Design Prompt 纯文本代码块 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('stylePage.promptTitle')}
            </h4>
            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono leading-relaxed text-slate-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
              {extractedResult.stylePrompt || extractedResult.designPrompt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
