import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex h-12 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-400">Blot-UI</span>
          <span className="text-xs text-slate-400">v1.0.0</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">AI App Builder</h1>
          <p className="mt-2 text-sm text-slate-400">
            Local-first, zero-placeholder, verification-driven application generator.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
