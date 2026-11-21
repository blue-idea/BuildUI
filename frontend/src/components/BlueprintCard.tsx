import React from 'react';
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
    <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{blueprint.appName}</h3>
          <p className="text-xs text-slate-400">{t('blueprint.subtitle')}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            blueprint.approved
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}
        >
          {blueprint.approved ? t('blueprint.approved') : t('blueprint.pendingApproval')}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('blueprint.designDirection')}
          </span>
          <p className="mt-1 text-slate-200">{blueprint.designDirection}</p>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('blueprint.primaryColor')}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-white/20"
                style={{ backgroundColor: blueprint.primaryColor }}
              />
              <span className="font-mono text-xs">{blueprint.primaryColor}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('blueprint.theme')}
            </span>
            <p className="mt-1 capitalize text-slate-200">{blueprint.themeId}</p>
          </div>
        </div>

        {blueprint.visuals && blueprint.visuals.length > 0 && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('blueprint.visualElements')}
            </span>
            <div className="mt-2 space-y-2">
              {blueprint.visuals.map((vis) => (
                <div
                  key={vis.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/80 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-300 uppercase">{vis.id}</span>
                  <span className="text-slate-400">{vis.description}</span>
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {vis.prompt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-800 pt-3">
        {blueprint.approved ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span>{t('blueprint.approvedHint')}</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => onApprove(blueprint.chatId)}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 shadow-sm"
          >
            {loading ? t('common.loading') : t('blueprint.approveBtn')}
          </button>
        )}
      </div>
    </div>
  );
};
