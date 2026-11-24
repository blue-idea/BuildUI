import { useState } from 'react';
import { ArrowLeft, KeyRound, Plug, Plus, X } from 'lucide-react';
import { pluginBridge } from '../services/wailsBridge';
import { getCatalogPlugin } from '../config/plugins';
import type { InstalledPlugin, PluginConfig, PluginTool } from '../types/plugin';

interface Props {
  plugin: InstalledPlugin;
  projects: { id: number; name: string }[];
  onClose: () => void;
  onEdit: () => void;
  onUpdate: (plugin: InstalledPlugin) => void;
  onDelete: () => void;
  onToolCount: (count: number) => void;
}

const action = 'rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800';
const field = 'min-w-0 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700';

export function PluginDetails({ plugin, projects, onClose, onEdit, onUpdate, onDelete, onToolCount }: Props) {
  const [draft, setDraft] = useState<{ oldKey: string; key: string; value: string } | null>(null);
  const [tools, setTools] = useState<PluginTool[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [oauth, setOAuth] = useState<{ clientId: string; clientSecret: string; scope: string } | null>(null);
  const [oauthRedirect, setOAuthRedirect] = useState('');
  const isHTTP = plugin.transport === 'http';
  const title = isHTTP ? 'Headers' : 'Environment variables';
  const keys = (isHTTP ? plugin.headers : plugin.env) ?? [];
  const requiredHeader = isHTTP ? getCatalogPlugin(plugin.catalogId)?.requiredHeader : undefined;
  const missingHeader = requiredHeader && !keys.some((key) => key.toLowerCase() === requiredHeader.toLowerCase());

  async function perform(work: (api: NonNullable<ReturnType<typeof pluginBridge>>) => Promise<void>) {
    const api = pluginBridge();
    if (!api || busy) return;
    setBusy(true);
    setError('');
    setStatus('');
    try { await work(api); }
    catch (failure) {
      setStatus('');
      setError(failure instanceof Error ? failure.message : String(failure));
    }
    finally { setBusy(false); }
  }

  function saveCredential(edit: NonNullable<typeof draft>) {
    void perform(async (api) => {
      onUpdate(await api.SavePluginCredential({ pluginId: plugin.id, ...edit }));
      setDraft(null);
      setTools(null);
      onToolCount(0);
      setStatus('Credentials saved. Test the connection to refresh tools.');
    });
  }

  function updateConfig(patch: Partial<PluginConfig>) {
    void perform(async (api) => {
      onUpdate(await api.SavePlugin({ ...plugin, ...patch }));
      if (patch.enabled === false) { setTools(null); onToolCount(0); }
    });
  }

  function discover() {
    void perform(async (api) => {
      setTools(null);
      onToolCount(0);
      const discovered = await api.ListPluginTools(plugin.id) ?? [];
      setTools(discovered);
      onToolCount(discovered.filter((tool) => tool.allowed).length);
      setStatus('Connected');
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-10 backdrop-blur-xs" onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="plugin-details-title" className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <header className="border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
          <div className="mb-4 flex items-center justify-between">
            <button autoFocus type="button" onClick={onClose} disabled={busy} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400"><ArrowLeft size={14} /> All Plugins</button>
            <button type="button" aria-label="Close" disabled={busy} onClick={onClose} className="text-slate-500 dark:text-zinc-400"><X size={18} /></button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Plug size={18} /></span>
            <div className="min-w-0 flex-1">
              <h2 id="plugin-details-title" className="text-lg font-semibold">{plugin.name}</h2>
              <p className="break-all text-xs text-slate-500 dark:text-zinc-400">{isHTTP ? 'Streamable HTTP' : 'stdio'} · {plugin.endpoint}</p>
            </div>
            <button type="button" className={action} disabled={busy} onClick={onEdit}>Edit connection</button>
            <button type="button" role="switch" aria-checked={plugin.enabled} aria-label="Enable plugin" className={action} disabled={busy} onClick={() => updateConfig({ enabled: !plugin.enabled })}>{plugin.enabled ? 'Enabled' : 'Disabled'}</button>
          </div>
        </header>

        <div className="space-y-5 px-6 py-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
          {status && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{status}</p>}
          {projects.length > 0 && <label className="block space-y-2 text-sm font-semibold">
            <span>Available in</span>
            <select className={field} disabled={busy} value={plugin.appId ?? ''} onChange={(e) => updateConfig({ appId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">All projects</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>}

          {isHTTP && !requiredHeader && <section aria-label="OAuth" className="space-y-3 border-b border-slate-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">OAuth</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{plugin.oauthConnected ? 'Signed in' : 'Optional browser sign-in'}</p>
              </div>
              {plugin.oauthConnected ? <button type="button" className={action} disabled={busy} onClick={() => {
                void perform(async (api) => {
                  onUpdate(await api.DisconnectPlugin(plugin.id));
                  setTools(null);
                  onToolCount(0);
                  setStatus('OAuth disconnected.');
                });
              }}>Disconnect OAuth</button> : <button type="button" className={action} disabled={busy || !!oauth || !plugin.enabled} onClick={() => {
                void perform(async (api) => {
                  setOAuthRedirect(await api.PluginOAuthRedirectURL());
                  setOAuth({ clientId: '', clientSecret: '', scope: '' });
                });
              }}>Sign in with OAuth</button>}
            </div>
            {oauth && <form className="space-y-3 rounded-xl border border-blue-200 p-3 dark:border-blue-900" onSubmit={(event) => {
              event.preventDefault();
              void perform(async (api) => {
                setStatus('Waiting for browser authorization…');
                onUpdate(await api.SignInPlugin(plugin.id, oauth));
                setOAuth(null);
                setStatus('OAuth connected.');
              });
            }}>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Leave the client fields blank to register automatically. For an existing client, register <code className="break-all">{oauthRedirect}</code>.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold"><span>Client ID or metadata URL</span><input className={field} value={oauth.clientId} disabled={busy} onChange={(event) => setOAuth({ ...oauth, clientId: event.target.value })} /></label>
                <label className="space-y-1 text-xs font-semibold"><span>Client secret</span><input className={field} value={oauth.clientSecret} type="password" autoComplete="off" disabled={busy} onChange={(event) => setOAuth({ ...oauth, clientSecret: event.target.value })} /></label>
                <label className="space-y-1 text-xs font-semibold sm:col-span-2"><span>Scope</span><input className={field} value={oauth.scope} disabled={busy} onChange={(event) => setOAuth({ ...oauth, scope: event.target.value })} /></label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className={action} disabled={busy} onClick={() => setOAuth(null)}>Cancel</button>
                <button type="submit" className={action} disabled={busy}>Open browser</button>
              </div>
            </form>}
          </section>}

          <section className="space-y-3" aria-label={title}>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><KeyRound size={15} />{title}</h3>
              <button type="button" className={action} disabled={busy || !!draft || plugin.credentialsUnreadable} onClick={() => setDraft({ oldKey: '', key: missingHeader ? requiredHeader : '', value: '' })}><Plus size={13} className="mr-1 inline" />{isHTTP ? 'Add Header' : 'Add Variable'}</button>
            </div>
            {plugin.credentialsUnreadable && <p className="text-sm text-red-700 dark:text-red-300">Saved credentials could not be decrypted.</p>}
            {missingHeader && !draft && <p className="text-xs text-slate-500 dark:text-zinc-400">Add your API key as <code>{requiredHeader}</code> to connect.</p>}
            {!missingHeader && !keys.length && !draft && !plugin.credentialsUnreadable && <p className="text-xs text-slate-500 dark:text-zinc-400">{isHTTP ? 'No headers configured.' : 'No environment variables configured.'}</p>}
            {keys.map((key) => <div key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-zinc-800/70">
              <code className="min-w-0 flex-1 break-all text-xs">{key}</code>
              <button type="button" className={action} disabled={busy || !!draft} aria-label={'Edit ' + key} onClick={() => setDraft({ oldKey: key, key, value: '' })}>Edit</button>
              <button type="button" className={action} disabled={busy || !!draft} aria-label={'Remove ' + key} onClick={() => saveCredential({ oldKey: key, key: '', value: '' })}>Remove</button>
            </div>)}
            {draft && <form className="space-y-3 rounded-xl border border-blue-200 p-3 dark:border-blue-900" onSubmit={(e) => { e.preventDefault(); saveCredential(draft); }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold"><span>Key</span><input className={field} value={draft.key} required disabled={busy} onChange={(e) => setDraft({ ...draft, key: e.target.value })} /></label>
                <label className="space-y-1 text-xs font-semibold"><span>Value</span><input className={field} type="password" autoComplete="off" value={draft.value} required disabled={busy} onChange={(e) => setDraft({ ...draft, value: e.target.value })} /></label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className={action} disabled={busy} onClick={() => setDraft(null)}>Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={busy}>Save</button>
              </div>
            </form>}
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Tools</h3>
              <button type="button" className={action} disabled={busy || !plugin.enabled || plugin.credentialsUnreadable || !!missingHeader} onClick={discover}>Test connection</button>
            </div>
            {tools === null ? <p className="text-xs text-slate-500 dark:text-zinc-400">Test the connection to discover available tools.</p> : tools.length === 0 ? <p className="text-xs text-slate-500 dark:text-zinc-400">This server returned no tools.</p> : (
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {tools.map((tool) => <label key={tool.name} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/70">
                  <input type="checkbox" aria-label={'Allow ' + tool.name} checked={tool.allowed} disabled={busy} onChange={(e) => {
                    const allowed = e.target.checked;
                    void perform(async (api) => {
                      await api.SetPluginToolPermission(plugin.id, tool.name, allowed);
                      const updated = tools.map((candidate) => candidate.name === tool.name ? { ...candidate, allowed } : candidate);
                      setTools(updated);
                      onToolCount(updated.filter((item) => item.allowed).length);
                    });
                  }} />
                  <span className="min-w-0 text-xs"><span className="block font-semibold">{tool.name}</span><span className="block whitespace-pre-wrap break-words text-slate-500 dark:text-zinc-400">{tool.description}</span></span>
                </label>)}
              </div>
            )}
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-zinc-800">
          {confirmDelete && <><span className="mr-auto text-xs">Delete this plugin and its saved settings?</span><button type="button" className={action} disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button></>}
          <button type="button" className={action + ' text-red-700 dark:text-red-300'} disabled={busy} onClick={() => {
            if (!confirmDelete) { setConfirmDelete(true); return; }
            void perform(async (api) => { await api.DeletePlugin(plugin.id); onDelete(); });
          }}>{confirmDelete ? 'Confirm deletion' : 'Delete Plugin'}</button>
        </footer>
      </section>
    </div>
  );
}
