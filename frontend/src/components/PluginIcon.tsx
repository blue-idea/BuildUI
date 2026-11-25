import React, { useState } from 'react';
import type { PluginItem } from '../types/plugin';

export interface PluginIconProps {
  plugin: Pick<PluginItem, 'id' | 'name' | 'iconBg' | 'iconText' | 'iconUrl'>;
  className?: string;
}

/**
 * 渲染预设插件的真实官方站点矢量图标，杜绝文字缩写；
 * 自定义插件优先显示 iconUrl，若无则优雅回退。
 */
export const PluginIcon: React.FC<PluginIconProps> = ({ plugin, className = 'w-10 h-10' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  // 若提供了自定义真实的 iconUrl 且未加载失败，优先渲染真实图片
  if (plugin.iconUrl && !imgFailed) {
    return (
      <div
        data-testid={`plugin-icon-${plugin.id}`}
        className={`${className} rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden select-none`}
      >
        <img
          src={plugin.iconUrl}
          alt={plugin.name}
          className="w-full h-full object-contain"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  // 预设插件官方真实站点矢量图标
  switch (plugin.id) {
    case 'expo':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-black text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Expo"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 128 128">
            <path d="M72.6 15.6L126.9 112.4H87.1L64 71.3L40.9 112.4H1.1L55.4 15.6C59.3 8.7 68.7 8.7 72.6 15.6Z" />
            <path d="M47.2 92.5L64 62.5L80.8 92.5H47.2Z" />
          </svg>
        </div>
      );

    case 'shadcn':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-black text-white flex items-center justify-center shadow-xs shrink-0 select-none border border-zinc-800`}
          title="shadcn/ui"
        >
          <svg className="w-5 h-5" viewBox="0 0 256 256">
            <rect width="256" height="256" fill="none" />
            <line x1="208" y1="128" x2="128" y2="208" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="192" y1="40" x2="40" y2="192" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    case 'playwright':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-[#2e3440] text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Playwright"
        >
          <svg className="w-6 h-6" viewBox="0 0 36 36" fill="none">
            <path d="M14 6C8.5 6 4 10.5 4 16C4 22 10 28 14 30C15 28 16 26 16 24C16 19 14 15 14 6Z" fill="#2EA44F" />
            <circle cx="10" cy="15" r="2" fill="#fff" />
            <path d="M22 6C27.5 6 32 10.5 32 16C32 22 26 28 22 30C21 28 20 26 20 24C20 19 22 15 22 6Z" fill="#E5534B" />
            <circle cx="26" cy="15" r="2" fill="#fff" />
            <path d="M14 30C18 31 18 31 22 30" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'stitch':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Google Stitch"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="stitch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="35%" stopColor="#9B72CB" />
                <stop offset="70%" stopColor="#D96570" />
                <stop offset="100%" stopColor="#1E8E3E" />
              </linearGradient>
            </defs>
            <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="url(#stitch-grad)" />
          </svg>
        </div>
      );

    case 'mobbin':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-black text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Mobbin"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M3 5h3.5l5.5 8 5.5-8H21v14h-3.5V9.5l-5 7.2h-1l-5-7.2V19H3V5z" />
          </svg>
        </div>
      );

    case 'magicui':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xs shrink-0 select-none border border-slate-800`}
          title="Magic UI"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" className="stroke-indigo-400" />
            <path d="m14 7 3 3" />
            <path d="M5 6v4" className="stroke-amber-400" />
            <path d="M19 14v4" className="stroke-amber-400" />
            <path d="M10 2v2" className="stroke-pink-400" />
            <path d="M7 8H3" className="stroke-amber-400" />
            <path d="M21 16h-4" className="stroke-amber-400" />
            <path d="M11 3H9" className="stroke-pink-400" />
          </svg>
        </div>
      );

    case 'awwwards':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-[#1b1b1b] text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Awwwards"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M2.5 7.5L5 16.5h2l2.2-6.5L11.4 16.5h2l2.5-9h-2l-1.5 6.3L10.2 7.5h-1.4l-2.2 6.3L5.1 7.5H2.5zm16 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
          </svg>
        </div>
      );

    case 'github':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-[#24292e] text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="GitHub"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </div>
      );

    case 'cloudflare':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-[#f38020] text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Cloudflare"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.6.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
          </svg>
        </div>
      );

    case 'snyk':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-[#141522] text-white flex items-center justify-center shadow-xs shrink-0 select-none border border-zinc-800`}
          title="Snyk"
        >
          <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm4.5 11.5l-2.2-1.3-.8 1.4-1.5-.9 1.1-2.1-2.1-1.2 1.3-2.2 2.1 1.2.9-1.5 1.4.8-.9 1.6 2.1 1.2-1.4 3z" />
          </svg>
        </div>
      );

    case 'stripe':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-[#635bff] text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Stripe"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.5 12.521.5 6.643.5 2.692 3.61 2.692 8.71c0 5.21 3.58 7.42 7.733 8.959 2.472.915 3.328 1.584 3.328 2.548 0 .915-.806 1.426-2.172 1.426-2.365 0-5.187-.997-6.936-2.035l-.946 5.578C5.466 26.05 8.444 26.5 11.565 26.5c6.262 0 10.428-3.085 10.428-8.397 0-5.466-3.718-7.585-8.017-8.953z" transform="scale(0.85) translate(2, 2)" />
          </svg>
        </div>
      );

    case 'vercel':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-black dark:bg-zinc-800 text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Vercel"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2z" />
          </svg>
        </div>
      );

    case 'context7':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center shadow-xs shrink-0 select-none border border-slate-800`}
          title="Context7"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
            <path d="m3 8 9 5 9-5" />
            <path d="M12 13v8" />
            <path d="m7.5 5.5 9 5" strokeWidth="1.5" className="stroke-cyan-300" />
          </svg>
        </div>
      );

    case 'huggingface':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-[#ffd21e] text-amber-950 flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Hugging Face"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#FFD21E" />
            <path d="M7.5 13.5C8 15.5 9.8 17 12 17C14.2 17 16 15.5 16.5 13.5" stroke="#4B3800" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="8.5" cy="10" rx="1.5" ry="2" fill="#4B3800" />
            <ellipse cx="15.5" cy="10" rx="1.5" ry="2" fill="#4B3800" />
            <path d="M4 14C3.2 13 3 11.5 3.5 10.5C4 9.5 5 9 6 9.5L6.5 10" stroke="#E58A00" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 14C20.8 13 21 11.5 20.5 10.5C20 9.5 19 9 18 9.5L17.5 10" stroke="#E58A00" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'heygen':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="HeyGen"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="13" height="16" rx="3.5" fill="currentColor" fillOpacity="0.9" />
            <path d="M17 8.5l4.5-2.5v12L17 15.5V8.5z" fill="currentColor" />
            <circle cx="8.5" cy="10" r="2.2" fill="#6c47ff" />
            <path d="M5.5 16c.6-1.3 1.8-1.8 3-1.8s2.4.5 3 1.8" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'higgsfield':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-lime-400 text-zinc-950 flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Higgsfield"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#a3e635" stroke="none" />
            <path d="M7 12h10" stroke="#09090b" />
            <path d="M12 7v10" stroke="#09090b" />
            <circle cx="12" cy="12" r="3" fill="#09090b" stroke="none" />
            <path d="M16 8l-8 8" stroke="#09090b" strokeWidth="1.8" />
          </svg>
        </div>
      );

    case 'roboflow':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Roboflow"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 8V4h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 4h4v4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v4h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 16v4h-4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          </svg>
        </div>
      );

    case 'braintrust':
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 select-none`}
          title="Braintrust"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="6" r="2.5" fill="currentColor" stroke="none" />
            <circle cx="6" cy="17" r="2.5" fill="currentColor" stroke="none" />
            <circle cx="18" cy="17" r="2.5" fill="currentColor" stroke="none" />
            <path d="M12 8.5v4M12 12.5l-4.5 3M12 12.5l4.5 3" />
            <circle cx="12" cy="12.5" r="1.5" fill="#fff" />
          </svg>
        </div>
      );

    default:
      // 未知自定义插件：优雅回退
      return (
        <div
          data-testid={`plugin-icon-${plugin.id}`}
          className={`${className} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 select-none`}
          style={{ backgroundColor: plugin.iconBg || '#6366f1' }}
          title={plugin.name}
        >
          {plugin.iconText || plugin.name.slice(0, 2).toUpperCase()}
        </div>
      );
  }
};
