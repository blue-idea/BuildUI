export type Locale = 'en' | 'zh';

export interface I18nDictionary {
  common: {
    appName: string;
    proBadge: string;
    manageApp: string;
    loading: string;
    confirm: string;
    cancel: string;
    save: string;
    close: string;
  };
  dock: {
    toggle: string;
    home: string;
    settings: string;
    docs: string;
    templates: string;
    components: string;
    help: string;
  };
  chat: {
    newChat: string;
    version: string;
    placeholder: string;
    send: string;
    modeBuild: string;
    modePlan: string;
    modelAuto: string;
    writing: string;
    completed: string;
    inspectFile: string;
    stopGeneration: string;
  };
  workspace: {
    preview: string;
    code: string;
    publish: string;
    startingApp: string;
    systemMessages: string;
    reload: string;
    openExternal: string;
    addressBar: string;
    emptyConsole: string;
  };
  theme: {
    light: string;
    dark: string;
    toggle: string;
  };
  language: {
    en: string;
    zh: string;
    toggle: string;
  };
}
