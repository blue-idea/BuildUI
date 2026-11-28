import React, { useState, useRef } from 'react';
import { ExtractedStyle, StyleAppType } from '../types/style';
import { extractStyleFromReference } from '../utils/styleExtractor';
import { Sparkles, Upload, Copy, Check, Save, Loader2, AlertCircle, Globe, Smartphone, Monitor } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { ModelSelector } from './ModelSelector';
import { parseConfiguredProviders } from '../config/providers';
import {
  MACOS_CONTROLS,
  MACOS_FLAT_CARD,
  MACOS_SEGMENTED,
} from '../config/macosFlatUi';

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
  const [appType, setAppType] = useState<StyleAppType>('web');
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
          appType,
        });
        result = {
          id: dto.id || `style-${Date.now()}`,
          name: dto.name,
          appType: (dto.appType as StyleAppType) || appType,
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
        result = extractStyleFromReference(referenceInput, Boolean(imagePreview), appType);
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
    <div
      data-testid="style-extractor-component"
      className="flex flex-col gap-[clamp(0.875rem,1.4vw,1.25rem)]"
    >
      {/* 参照物输入表单扁平卡片 */}
      <div className={`${MACOS_FLAT_CARD.surface} p-[clamp(1rem,1.8vw,1.5rem)] flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-black/[0.06] dark:border-white/[0.07]">
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0071e3] dark:text-[#0a84ff] shrink-0" />
              <span>{t('stylePage.refInputTitle')}</span>
            </h3>
            <p className="text-[12px] text-[#6e6e73] dark:text-[#98989d] mt-0.5">
              {t('stylePage.refInputDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-[#6e6e73] dark:text-[#98989d] font-medium">
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
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200/80 dark:border-rose-800/60 flex flex-wrap items-center justify-between gap-3 text-[12px] text-rose-700 dark:text-rose-300"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{extractError}</span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-2.5 py-1 rounded-[7px] bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] shrink-0 cursor-pointer transition-colors"
              >
                {t('stylePage.btnGoSettings')}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* 应用形态分段选择器 (Web / App / Desktop) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <label className="text-[12px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              {t('stylePage.appTypeLabel')}
            </label>
            <div data-testid="app-type-selector" className={MACOS_SEGMENTED.track}>
              <button
                type="button"
                data-testid="app-type-pill-web"
                disabled={isExtracting}
                onClick={() => setAppType('web')}
                className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                  appType === 'web'
                    ? MACOS_SEGMENTED.itemActive
                    : MACOS_SEGMENTED.itemInactive
                }`}
              >
                <Globe
                  className={`w-3.5 h-3.5 ${
                    appType === 'web' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                  }`}
                />
                <span>{t('stylePage.appTypeWeb')}</span>
              </button>

              <button
                type="button"
                data-testid="app-type-pill-app"
                disabled={isExtracting}
                onClick={() => setAppType('app')}
                className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                  appType === 'app'
                    ? MACOS_SEGMENTED.itemActive
                    : MACOS_SEGMENTED.itemInactive
                }`}
              >
                <Smartphone
                  className={`w-3.5 h-3.5 ${
                    appType === 'app' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                  }`}
                />
                <span>{t('stylePage.appTypeApp')}</span>
              </button>

              <button
                type="button"
                data-testid="app-type-pill-desktop"
                disabled={isExtracting}
                onClick={() => setAppType('desktop')}
                className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                  appType === 'desktop'
                    ? MACOS_SEGMENTED.itemActive
                    : MACOS_SEGMENTED.itemInactive
                }`}
              >
                <Monitor
                  className={`w-3.5 h-3.5 ${
                    appType === 'desktop' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                  }`}
                />
                <span>{t('stylePage.appTypeDesktop')}</span>
              </button>
            </div>
          </div>

          {/* 响应式双栏输入区：宽屏并排，中小屏堆叠 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* 品牌/参照物文本输入 */}
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#515154] dark:text-[#aeaeb2]">
                {t('stylePage.labelBrand')}
              </label>
              <input
                type="text"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                disabled={isExtracting}
                placeholder={t('stylePage.brandPlaceholder')}
                className={`${MACOS_CONTROLS.input} h-11`}
              />
            </div>

            {/* 图片上传拖拽区 */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#515154] dark:text-[#aeaeb2]">
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
                className={`w-full h-11 border border-dashed border-black/[0.14] dark:border-white/[0.14] rounded-[9px] flex items-center justify-center gap-2 transition-colors px-3.5 bg-[#f5f5f7]/60 dark:bg-[#141416] ${
                  isExtracting
                    ? 'cursor-not-allowed opacity-55'
                    : 'hover:border-[#0071e3] dark:hover:border-[#0a84ff] hover:bg-[#0071e3]/[0.03] dark:hover:bg-[#0a84ff]/[0.06] cursor-pointer'
                }`}
              >
                {imagePreview ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-7 h-7 object-cover rounded-[6px] border border-black/[0.1] dark:border-white/[0.12] shrink-0"
                    />
                    <span className="text-[12px] text-[#0071e3] dark:text-[#0a84ff] font-medium truncate">
                      {t('stylePage.btnChangeImage')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[12px] text-[#6e6e73] dark:text-[#98989d]">
                    <Upload className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                    <span className="truncate">{t('stylePage.btnUploadImage')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 提取按钮 */}
        <div className="flex justify-end pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || (!referenceInput.trim() && !imagePreview)}
            className={`px-4 py-2 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
              isExtracting
                ? 'bg-[#0071e3]/70 dark:bg-[#0a84ff]/70 text-white cursor-not-allowed'
                : !referenceInput.trim() && !imagePreview
                ? 'bg-black/[0.08] dark:bg-white/[0.1] text-[#86868b] dark:text-[#636366] cursor-not-allowed'
                : 'bg-[#0071e3] hover:bg-[#0077ed] dark:bg-[#0a84ff] dark:hover:bg-[#2894ff] text-white cursor-pointer'
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
        <div className="flex flex-col gap-[clamp(0.875rem,1.4vw,1.25rem)]">
          {/* 色板与设计规范卡片 */}
          <div className={`${MACOS_FLAT_CARD.surface} p-[clamp(1rem,1.8vw,1.5rem)] flex flex-col gap-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-[14px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {extractedResult.name}
                  </h4>
                  {/* 应用形态中性微徽章 */}
                  <span
                    data-testid="extracted-style-app-type-badge"
                    className={MACOS_CONTROLS.neutralBadge}
                  >
                    {extractedResult.appType === 'app' ? (
                      <Smartphone className="w-3 h-3" />
                    ) : extractedResult.appType === 'desktop' ? (
                      <Monitor className="w-3 h-3" />
                    ) : (
                      <Globe className="w-3 h-3" />
                    )}
                    <span>
                      {extractedResult.appType === 'app'
                        ? t('stylePage.appTypeApp')
                        : extractedResult.appType === 'desktop'
                        ? t('stylePage.appTypeDesktop')
                        : t('stylePage.appTypeWeb')}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {extractedResult.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-[6px] text-[10.5px] font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#aeaeb2]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 操作按钮：保存为模版 / 复制 Prompt */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={MACOS_CONTROLS.secondaryButton}
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? t('stylePage.btnCopied') : t('stylePage.btnCopyPrompt')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] text-[12px] font-medium text-white transition-colors ${
                    isSaved
                      ? 'bg-emerald-600 opacity-90 cursor-default'
                      : 'bg-[#0071e3] hover:bg-[#0077ed] dark:bg-[#0a84ff] dark:hover:bg-[#2894ff] cursor-pointer'
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaved ? t('stylePage.btnSaved') : t('stylePage.btnSaveTemplate')}</span>
                </button>
              </div>
            </div>

            {/* 调色盘色块矩阵 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {[
                { label: t('stylePage.palettePrimary'), value: extractedResult.palette.primary },
                { label: t('stylePage.paletteBackground'), value: extractedResult.palette.background },
                { label: t('stylePage.paletteSurface'), value: extractedResult.palette.surface },
                { label: t('stylePage.paletteText'), value: extractedResult.palette.text },
                { label: t('stylePage.paletteBorder'), value: extractedResult.palette.border },
              ].map((swatch) => (
                <div
                  key={swatch.label}
                  className="p-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.07] bg-[#f5f5f7]/70 dark:bg-[#141416] flex flex-col gap-2"
                >
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#86868b] dark:text-[#8e8e93]">
                    {swatch.label}
                  </span>
                  <div
                    className="h-8 rounded-lg ring-1 ring-inset ring-black/10 dark:ring-white/15"
                    style={{ backgroundColor: swatch.value }}
                  />
                  <span className="text-[11.5px] font-mono font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {swatch.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 宽屏双栏：左实时预览，右设计提示词；中小屏自动堆叠 */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-[clamp(0.875rem,1.4vw,1.25rem)] items-start">
            {/* 实时 UI 效果模拟预览 */}
            <div
              className={`xl:col-span-6 ${MACOS_FLAT_CARD.surface} p-[clamp(1rem,1.8vw,1.5rem)] flex flex-col gap-3.5`}
            >
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#8e8e93]">
                {t('stylePage.livePreviewTitle')}
              </h4>

              <div
                className="p-5 rounded-xl border transition-colors"
                style={{
                  backgroundColor: extractedResult.palette.background,
                  borderColor: extractedResult.palette.border,
                }}
              >
                <div
                  className="p-4 rounded-xl border flex flex-col gap-3.5"
                  style={{
                    backgroundColor: extractedResult.palette.surface,
                    borderColor: extractedResult.palette.border,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: extractedResult.palette.primary }}
                      />
                      <span
                        className="text-[12.5px] font-semibold truncate"
                        style={{ color: extractedResult.palette.text }}
                      >
                        {t('stylePage.previewCardTitle')}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold shrink-0"
                      style={{
                        backgroundColor: `${extractedResult.palette.primary}1f`,
                        color: extractedResult.palette.primary,
                      }}
                    >
                      {t('stylePage.previewBadge')}
                    </span>
                  </div>

                  <p
                    className="text-[12px] leading-relaxed opacity-80"
                    style={{ color: extractedResult.palette.text }}
                  >
                    {t('stylePage.previewDesc')}
                  </p>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-white"
                      style={{ backgroundColor: extractedResult.palette.primary }}
                    >
                      {t('stylePage.previewActionBtn')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 生成的 Design Prompt 纯文本代码块 */}
            <div
              className={`xl:col-span-6 ${MACOS_FLAT_CARD.surface} p-[clamp(1rem,1.8vw,1.5rem)] flex flex-col gap-3`}
            >
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#8e8e93]">
                {t('stylePage.promptTitle')}
              </h4>
              <pre className="p-3.5 rounded-xl bg-[#f5f5f7] dark:bg-[#141416] border border-black/[0.06] dark:border-white/[0.08] text-[11px] font-mono leading-relaxed text-[#3a3a3c] dark:text-[#d1d1d6] overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto">
                {extractedResult.stylePrompt || extractedResult.designPrompt}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
