import React from 'react';

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
  return (
    <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{blueprint.appName}</h3>
          <p className="text-xs text-slate-400">Application Design Blueprint</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            blueprint.approved
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}
        >
          {blueprint.approved ? 'Approved' : 'Pending Approval'}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Design Direction
          </span>
          <p className="mt-1 text-slate-200">{blueprint.designDirection}</p>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Primary Color
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
              Theme
            </span>
            <p className="mt-1 capitalize text-slate-200">{blueprint.themeId}</p>
          </div>
        </div>

        {blueprint.visuals && blueprint.visuals.length > 0 && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Visual Elements
            </span>
            <div className="mt-2 space-y-1.5">
              {blueprint.visuals.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-400 uppercase">{v.type}</span>
                    <span className="text-slate-400">{v.id}</span>
                  </div>
                  <p className="mt-1 text-slate-300">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-800 pt-4">
        {blueprint.approved ? (
          <div className="text-center text-xs font-medium text-emerald-400">
            ✓ Blueprint approved. Code implementation unlocked.
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => onApprove(blueprint.chatId)}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Approving...' : 'Approve Blueprint & Start Generation'}
          </button>
        )}
      </div>
    </div>
  );
};
