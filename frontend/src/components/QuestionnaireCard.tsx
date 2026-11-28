import React, { useState } from 'react';
import { Sparkles, Check, SkipForward, Layers, Palette, LayoutGrid, MessageSquarePlus } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface QuestionItem {
  id: string;
  category?: 'features' | 'ui' | 'palette' | string;
  question: string;
  type: 'single_choice' | 'multi_choice' | 'text';
  options?: string[];
  allowCustom?: boolean;
  placeholder?: string;
}

export interface QuestionnaireProps {
  questions: QuestionItem[];
  summary?: string;
  onSubmit: (answers: Record<string, string | string[]>) => void;
  onSkip?: () => void;
  disabled?: boolean;
}

export const QuestionnaireCard: React.FC<QuestionnaireProps> = ({
  questions,
  summary,
  onSubmit,
  onSkip,
  disabled = false,
}) => {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const handleOptionSelect = (qId: string, option: string, isMulti: boolean) => {
    if (disabled) return;
    if (isMulti) {
      const current = (answers[qId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      setAnswers((prev) => ({ ...prev, [qId]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: option }));
    }
  };

  const handleTextChange = (key: string, value: string) => {
    if (disabled) return;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit(answers);
  };

  const answeredCount = questions.reduce((count, q) => {
    const val = answers[q.id];
    const custom = answers[`${q.id}__custom`];
    const hasMain = Array.isArray(val) ? val.length > 0 : Boolean(typeof val === 'string' && val.trim());
    const hasCustom = Boolean(typeof custom === 'string' && custom.trim());
    return count + (hasMain || hasCustom ? 1 : 0);
  }, 0);

  const renderCategoryBadge = (category?: string) => {
    if (!category) return null;
    if (category === 'features') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800/60">
          <LayoutGrid className="h-2.5 w-2.5" />
          <span>{t('questionnaire.catFeatures')}</span>
        </span>
      );
    }
    if (category === 'ui') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800/60">
          <Layers className="h-2.5 w-2.5" />
          <span>{t('questionnaire.catUi')}</span>
        </span>
      );
    }
    if (category === 'palette') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/60">
          <Palette className="h-2.5 w-2.5" />
          <span>{t('questionnaire.catPalette')}</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div
      data-testid="questionnaire-card"
      className="w-full rounded-2xl border border-blue-200/80 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-md dark:border-blue-500/25 dark:from-zinc-900 dark:to-zinc-900/95 text-slate-800 dark:text-slate-100"
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-zinc-800 pb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('questionnaire.title')}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              {summary?.trim() ? summary : t('questionnaire.subtitle')}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800/60">
          {t('questionnaire.answeredCount', { answered: answeredCount, total: questions.length })}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => {
          const isMulti = q.type === 'multi_choice';
          const typeLabel =
            q.type === 'text'
              ? t('questionnaire.textInput')
              : isMulti
              ? t('questionnaire.multiChoice')
              : t('questionnaire.singleChoice');

          return (
            <div
              key={q.id}
              className="rounded-xl border border-slate-200/80 bg-white/90 p-3 dark:border-zinc-800 dark:bg-zinc-950/60 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {renderCategoryBadge(q.category)}
                  <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                    {typeLabel}
                  </span>
                </div>
              </div>

              <label className="block text-[13px] font-semibold leading-snug text-slate-800 dark:text-zinc-100">
                {idx + 1}. {q.question}
              </label>

              {q.type === 'text' ? (
                <input
                  type="text"
                  disabled={disabled}
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder={q.placeholder || t('questionnaire.textPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options?.map((opt) => {
                      const isSelected = isMulti
                        ? ((answers[q.id] as string[]) || []).includes(opt)
                        : answers[q.id] === opt;

                      return (
                        <button
                          type="button"
                          key={opt}
                          disabled={disabled}
                          aria-pressed={isSelected}
                          onClick={() => handleOptionSelect(q.id, opt, isMulti)}
                          className={`group flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/90 text-blue-800 shadow-2xs ring-1 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-200'
                              : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-blue-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span className="leading-snug">{opt}</span>
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center transition-colors ${
                              isMulti ? 'rounded-md' : 'rounded-full'
                            } ${
                              isSelected
                                ? 'bg-blue-600 text-white dark:bg-blue-500'
                                : 'border border-slate-300 bg-white dark:border-zinc-600 dark:bg-zinc-800'
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {q.allowCustom && (
                    <div className="pt-1">
                      <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-2.5 py-1.5 focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900/40">
                        <MessageSquarePlus className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          disabled={disabled}
                          value={(answers[`${q.id}__custom`] as string) || ''}
                          onChange={(e) => handleTextChange(`${q.id}__custom`, e.target.value)}
                          placeholder={t('questionnaire.customPlaceholder')}
                          aria-label={`${t('questionnaire.customLabel')} ${idx + 1}`}
                          className="w-full bg-transparent text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none dark:text-zinc-200 dark:placeholder-zinc-500"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={disabled}
            data-testid="questionnaire-submit-btn"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{disabled ? t('questionnaire.submitting') : t('questionnaire.submitBtn')}</span>
          </button>

          {onSkip && (
            <button
              type="button"
              disabled={disabled}
              data-testid="questionnaire-skip-btn"
              onClick={onSkip}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>{t('questionnaire.skipBtn')}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
