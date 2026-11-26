import { useState } from 'react';
import { ArrowLeft, KeyRound, Plug, Plus, X } from 'lucide-react';
import { pluginBridge } from '../services/wailsBridge';
import { getCatalogPlugin } from '../config/plugins';
import { PluginIcon } from './PluginIcon';
import { PluginEnabledSwitch } from './PluginEnabledSwitch';
import { useI18n } from '../i18n/I18nContext';
import type { InstalledPlugin, PluginConfig, PluginTool } from '../types/plugin';

interface Props {
  plugin: InstalledPlugin;
  projects: { id: number; name: string }[];
  onClose: () => void;
  onEdit: () => void;
  onUpdate: (plugin: InstalledPlugin) => void;
  onSaveConfig: (patch: Partial<PluginConfig>) => Promise<void>;
  onDelete: () => void;
  onToolCount: (count: number) => void;
}

const action = 'rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800';
const field = 'min-w-0 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700';

export function PluginDetails({ plugin, projects, onClose, onEdit, onUpdate, onSaveConfig, onDelete, onToolCount }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<{ oldKey: string; key: string; value: string } | null>(null);
  const [tools, setTools] = useState<PluginTool[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [oauth, setOAuth] = useState<{ clientId: string; clientSecret: string; scope: string } | null>(null);
  const [oauthRedirect, setOAuthRedirect] = useState('');
  const isHTTP = plugin.transport === 'http';
  const title = isHTTP ? t('pluginsPage.detailsHeadersTitle') : t('pluginsPage.detailsEnvTitle');
  const keys = (isHTTP ? plugin.headers : plugin.env) ?? [];
  const catalogPlugin = getCatalogPlugin(plugin.catalogId);
  const catalogCredential = catalogPlugin?.credential;
  const credential = catalogCredential?.transport === plugin.transport ? catalogCredential : undefined;
  const normalizeCredentialName = (key: string) => isHTTP ? key.toLowerCase() : key;
  const unconfiguredCredential = credential && !keys.some((key) => normalizeCredentialName(key) === normalizeCredentialName(credential.name)) ? credential : undefined;

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
      setStatus(t('pluginsPage.detailsCredentialsSaved'));
    });
  }

  function updateConfig(patch: Partial<PluginConfig>) {
    void perform(async () => {
      await onSaveConfig(patch);
      if (patch.enabled === false) setTools(null);
    });
  }

  function discover() {
    void perform(async (api) => {
      setTools(null);
      onToolCount(0);
      const discovered = await api.ListPluginTools(plugin.id) ?? [];
      setTools(discovered);
      onToolCount(discovered.filter((tool) => tool.allowed).length);
      setStatus(t('pluginsPage.detailsConnectedStatus'));
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-10 backdrop-blur-xs" onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="plugin-details-title" className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <header className="border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
          <div className="mb-4 flex items-center justify-between">
            <button autoFocus type="button" onClick={onClose} disabled={busy} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400"><ArrowLeft size={14} /> {t('pluginsPage.detailsBackAll')}</button>
            <button type="button" aria-label={t('common.close')} disabled={busy} onClick={onClose} className="text-slate-500 dark:text-zinc-400"><X size={18} /></button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {plugin.catalogId ? (
              <PluginIcon plugin={{ id: plugin.catalogId, name: plugin.name, iconUrl: catalogPlugin?.iconUrl, iconBg: catalogPlugin?.iconBg }} />
            ) : (
              <span className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Plug size={18} /></span>
            )}
            <div className="min-w-0 flex-1">
              <h2 id="plugin-details-title" className="text-lg font-semibold">{plugin.name}</h2>
              <p className="break-all text-xs text-slate-500 dark:text-zinc-400">{isHTTP ? t('pluginsPage.detailsHttpTransport') : t('pluginsPage.detailsStdioTransport')} · {plugin.endpoint}</p>
            </div>
            <button type="button" className={action} disabled={busy} onClick={onEdit}>{t('pluginsPage.detailsEditConnection')}</button>
            <PluginEnabledSwitch enabled={plugin.enabled} disabled={busy} onChange={(enabled) => updateConfig({ enabled })} />
          </div>
        </header>

        <div className="space-y-5 px-6 py-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
          {status && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{status}</p>}
          {projects.length > 0 && <label className="block space-y-2 text-sm font-semibold">
            <span>{t('pluginsPage.detailsAvailableIn')}</span>
            <select className={field} disabled={busy} value={plugin.appId ?? ''} onChange={(e) => updateConfig({ appId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">{t('pluginsPage.detailsAllProjects')}</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>}

          {isHTTP && !credential?.required && catalogPlugin?.supportsOAuth !== false && <section aria-label="OAuth" className="space-y-3 border-b border-slate-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{t('pluginsPage.detailsOauthTitle')}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{plugin.oauthConnected ? t('pluginsPage.detailsOauthSignedIn') : t('pluginsPage.detailsOauthOptionalSignIn')}</p>
              </div>
              {plugin.oauthConnected ? <button type="button" className={action} disabled={busy} onClick={() => {
                void perform(async (api) => {
                  onUpdate(await api.DisconnectPlugin(plugin.id));
                  setTools(null);
                  onToolCount(0);
                  setStatus(t('pluginsPage.detailsOauthDisconnected'));
                });
              }}>{t('pluginsPage.detailsOauthDisconnect')}</button> : <button type="button" className={action} disabled={busy || !!oauth || !plugin.enabled} onClick={() => {
                void perform(async (api) => {
                  setOAuthRedirect(await api.PluginOAuthRedirectURL());
                  setOAuth({ clientId: '', clientSecret: '', scope: '' });
                });
              }}>{t('pluginsPage.detailsOauthSignIn')}</button>}
            </div>
            {oauth && <form className="space-y-3 rounded-xl border border-blue-200 p-3 dark:border-blue-900" onSubmit={(event) => {
              event.preventDefault();
              void perform(async (api) => {
                setStatus(t('pluginsPage.detailsOauthWaitingBrowser'));
                onUpdate(await api.SignInPlugin(plugin.id, oauth));
                setOAuth(null);
                setStatus(t('pluginsPage.detailsOauthConnected'));
              });
            }}>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{t('pluginsPage.detailsOauthHelp', { redirect: oauthRedirect })}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold"><span>{t('pluginsPage.detailsOauthClientId')}</span><input className={field} value={oauth.clientId} disabled={busy} onChange={(event) => setOAuth({ ...oauth, clientId: event.target.value })} /></label>
                <label className="space-y-1 text-xs font-semibold"><span>{t('pluginsPage.detailsOauthClientSecret')}</span><input className={field} value={oauth.clientSecret} type="password" autoComplete="off" disabled={busy} onChange={(event) => setOAuth({ ...oauth, clientSecret: event.target.value })} /></label>
                <label className="space-y-1 text-xs font-semibold sm:col-span-2"><span>{t('pluginsPage.detailsOauthScope')}</span><input className={field} value={oauth.scope} disabled={busy} onChange={(event) => setOAuth({ ...oauth, scope: event.target.value })} /></label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className={action} disabled={busy} onClick={() => setOAuth(null)}>{t('common.cancel')}</button>
                <button type="submit" className={action} disabled={busy}>{t('pluginsPage.detailsOauthOpenBrowser')}</button>
              </div>
            </form>}
          </section>}

          <section className="space-y-3" aria-label={title}>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><KeyRound size={15} />{title}</h3>
              <button type="button" className={action} disabled={busy || !!draft || plugin.credentialsUnreadable} onClick={() => setDraft({ oldKey: '', key: unconfiguredCredential?.name ?? '', value: '' })}><Plus size={13} className="mr-1 inline" />{isHTTP ? t('pluginsPage.detailsAddHeader') : t('pluginsPage.detailsAddVariable')}</button>
            </div>
            {plugin.credentialsUnreadable && <p className="text-sm text-red-700 dark:text-red-300">{t('pluginsPage.detailsDecryptError')}</p>}
            {unconfiguredCredential && !draft && !plugin.credentialsUnreadable && <p className="text-xs text-slate-500 dark:text-zinc-400">{unconfiguredCredential.hint}</p>}
            {!unconfiguredCredential && !keys.length && !draft && !plugin.credentialsUnreadable && <p className="text-xs text-slate-500 dark:text-zinc-400">{isHTTP ? t('pluginsPage.detailsNoHeaders') : t('pluginsPage.detailsNoEnv')}</p>}
            {keys.map((key) => <div key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-zinc-800/70">
              <code className="min-w-0 flex-1 break-all text-xs">{key}</code>
              <button type="button" className={action} disabled={busy || !!draft} aria-label={t('pluginsPage.detailsEditAria', { name: key })} onClick={() => setDraft({ oldKey: key, key, value: '' })}>{t('pluginsPage.detailsBtnEdit')}</button>
              <button type="button" className={action} disabled={busy || !!draft} aria-label={t('pluginsPage.detailsRemoveAria', { name: key })} onClick={() => saveCredential({ oldKey: key, key: '', value: '' })}>{t('pluginsPage.detailsBtnRemove')}</button>
            </div>)}
            {draft && <form className="space-y-3 rounded-xl border border-blue-200 p-3 dark:border-blue-900" onSubmit={(e) => { e.preventDefault(); saveCredential(draft); }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold"><span>{t('pluginsPage.detailsKeyLabel')}</span><input className={field} value={draft.key} required disabled={busy} onChange={(e) => setDraft({ ...draft, key: e.target.value })} /></label>
                <label className="space-y-1 text-xs font-semibold"><span>{t('pluginsPage.detailsValueLabel')}</span><input className={field} type="password" autoComplete="off" value={draft.value} placeholder={credential && normalizeCredentialName(draft.key) === normalizeCredentialName(credential.name) ? credential.valuePlaceholder : undefined} required disabled={busy} onChange={(e) => setDraft({ ...draft, value: e.target.value })} /></label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className={action} disabled={busy} onClick={() => setDraft(null)}>{t('common.cancel')}</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={busy}>{t('common.save')}</button>
              </div>
            </form>}
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('pluginsPage.detailsToolsTitle')}</h3>
              <button type="button" className={action} disabled={busy || !plugin.enabled || plugin.credentialsUnreadable || !!unconfiguredCredential?.required} onClick={discover}>{t('pluginsPage.detailsTestConnection')}</button>
            </div>
            {tools === null ? <p className="text-xs text-slate-500 dark:text-zinc-400">{t('pluginsPage.detailsTestConnectionHint')}</p> : tools.length === 0 ? <p className="text-xs text-slate-500 dark:text-zinc-400">{t('pluginsPage.detailsNoTools')}</p> : (
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {tools.map((tool) => <label key={tool.name} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/70">
                  <input type="checkbox" aria-label={t('pluginsPage.detailsAllowToolAria', { name: tool.name })} checked={tool.allowed} disabled={busy} onChange={(e) => {
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
          {confirmDelete && <><span className="mr-auto text-xs">{t('pluginsPage.detailsConfirmDeletePrompt')}</span><button type="button" className={action} disabled={busy} onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</button></>}
          <button type="button" className={action + ' text-red-700 dark:text-red-300'} disabled={busy} onClick={() => {
            if (!confirmDelete) { setConfirmDelete(true); return; }
            void perform(async (api) => { await api.DeletePlugin(plugin.id); onDelete(); });
          }}>{confirmDelete ? t('pluginsPage.detailsBtnConfirmDeletion') : t('pluginsPage.detailsBtnDelete')}</button>
        </footer>
      </section>
    </div>
  );
}

