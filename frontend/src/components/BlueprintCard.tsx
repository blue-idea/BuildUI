import React from 'react';
import { Compass, Palette, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface VisualItem {
  id: string;
  type: string;
  description: string;
  prompt: string;
}

export interface BlueprintDTO {
  chatId: number;
  appName: string;
  designDirection: string;
  primaryColor: string;
  themeId: string;
  visuals: VisualItem[];
  approved: boolean;
}

export interface BlueprintCardProps {
  blueprint: BlueprintDTO;
  onApprove: (chatId: number) => void;
  loading?: boolean;
}

export const BlueprintCard: React.FC<BlueprintCardProps> = ({
  blueprint,
  onApprove,
  loading = false,
}) => {
  const { t } = useI18n();

  return (
    <div
      data-testid="blueprint-card"
      className="w-full rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/95 text-slate-800 dark:text-slate-100"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-zinc-800 pb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-800/60">
            <Compass className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {blueprint.appName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{t('blueprint.subtitle')}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
            blueprint.approved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800'
          }`}
        >
          {blueprint.approved ? t('blueprint.approved') : t('blueprint.pendingApproval')}
        </span>
      </div>

      <div className="mt-3.5 space-y-3 text-sm">
        <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {t('blueprint.designDirection')}
          </span>
          <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-zinc-200 whitespace-pre-wrap">
            {blueprint.designDirection}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              <Palette className="h-3 w-3" />
              <span>{t('blueprint.primaryColor')}</span>
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-black/10 dark:border-white/20 shadow-2xs shrink-0"
                style={{ backgroundColor: blueprint.primaryColor }}
              />
              <span className="font-mono text-xs font-medium text-slate-800 dark:text-zinc-200">
                {blueprint.primaryColor}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              <Layers className="h-3 w-3" />
              <span>{t('blueprint.theme')}</span>
            </span>
            <p className="mt-1.5 text-xs font-medium capitalize text-slate-800 dark:text-zinc-200 truncate">
              {blueprint.themeId}
            </p>
          </div>
        </div>

        {blueprint.visuals && blueprint.visuals.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {t('blueprint.visualElements')}
            </span>
            <div className="mt-1.5 space-y-1.5">
              {blueprint.visuals.map((vis) => (
                <div
                  key={vis.id}
                  className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase">
                      {vis.id}
                    </span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {vis.prompt}
                    </span>
                  </div>
                  <span className="text-slate-600 dark:text-zinc-400 leading-snug">
                    {vis.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-slate-200/80 dark:border-zinc-800 pt-3">
        {blueprint.approved ? (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t('blueprint.approvedHint')}</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => onApprove(blueprint.chatId)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{loading ? t('common.loading') : t('blueprint.approveBtn')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
