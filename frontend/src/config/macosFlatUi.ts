/**
 * macOS 扁平化桌面 UI 视觉令牌与响应式布局样式配置
 * 仅用于前端展示层复用（风格页与后续工程管理页共享），不包含任何业务逻辑。
 */

export const MACOS_FLAT_PAGE = {
  /** 全页滚动根画布：对齐 macOS Window Background (#f5f5f7 / #121214) */
  root: 'flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#f5f5f7] dark:bg-[#121214] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col transition-colors selection:bg-[#0071e3]/15 dark:selection:bg-[#0a84ff]/25',
  /** 流式全宽内容容器：随桌面窗口宽度通过 clamp() 平滑缩放留白与间距 */
  container:
    'w-full max-w-[1800px] mx-auto px-[clamp(1rem,2.4vw,2.5rem)] py-[clamp(1rem,2vw,1.875rem)] flex flex-col gap-[clamp(1rem,1.6vw,1.5rem)] pb-12',
  /** 顶部标题栏：极细 1px hairline 底线，窄屏自动优雅折行 */
  header:
    'flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5 border-b border-black/[0.08] dark:border-white/[0.08] pb-[clamp(0.875rem,1.4vw,1.25rem)]',
  /** 页面主标题 */
  title:
    'text-[clamp(1.125rem,1.35vw,1.375rem)] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight',
  /** 页面副标题 */
  subtitle: 'text-[12px] text-[#6e6e73] dark:text-[#98989d] mt-0.5 leading-relaxed',
  /** 头部图标徽章：Apple System Blue 扁平轻底 */
  headerIconBox:
    'w-9 h-9 rounded-[10px] bg-[#0071e3]/10 dark:bg-[#0a84ff]/15 text-[#0071e3] dark:text-[#0a84ff] border border-[#0071e3]/15 dark:border-[#0a84ff]/20 flex items-center justify-center shrink-0',
} as const;

export const MACOS_FLAT_GRID = {
  /** 自适应流式卡片网格：随窗口尺寸在 1 至 5+ 列之间无缝缩放 */
  cards:
    'grid grid-cols-[repeat(auto-fill,minmax(min(100%,268px),1fr))] gap-[clamp(0.75rem,1.25vw,1.125rem)]',
} as const;

export const MACOS_FLAT_CARD = {
  /** 基础扁平卡片表面：纯白/深灰表面 + 1px hairline 边框，无厚重阴影 */
  surface:
    'rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.09] transition-[border-color,background-color] duration-150',
  /** 交互型卡片默认态 */
  interactiveIdle:
    'border-black/[0.08] dark:border-white/[0.09] bg-white dark:bg-[#1c1c1e] hover:border-black/[0.18] dark:hover:border-white/[0.18] hover:bg-white dark:hover:bg-[#222225]',
  /** 交互型卡片选中态：Apple System Blue 扁平描边 */
  interactiveActive:
    'border-[#0071e3] dark:border-[#0a84ff] bg-white dark:bg-[#1c1c1e] ring-2 ring-[#0071e3]/15 dark:ring-[#0a84ff]/20',
  /** 扁平虚线空状态卡片 */
  emptyState:
    'px-6 py-14 text-center rounded-2xl border border-dashed border-black/[0.12] dark:border-white/[0.12] bg-white/75 dark:bg-[#1c1c1e]/75 flex flex-col items-center justify-center gap-3',
} as const;

export const MACOS_SEGMENTED = {
  /** macOS 原生分段控制器外槽 */
  track:
    'inline-flex flex-wrap items-center p-[3px] rounded-[10px] bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.04] dark:border-white/[0.06] select-none',
  /** 分段按钮通用结构 */
  itemBase:
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap',
  /** 分段按钮激活滑块：纯扁平微描边 */
  itemActive:
    'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]',
  /** 分段按钮未激活态 */
  itemInactive:
    'border border-transparent text-[#6e6e73] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]',
  /** 分段按钮内部计数小徽章 */
  countBadge:
    'px-1.5 py-0.2 rounded-[5px] text-[10px] font-medium bg-black/[0.06] dark:bg-white/[0.1] text-[#6e6e73] dark:text-[#aeaeb2]',
} as const;

export const MACOS_CONTROLS = {
  /** 中性扁平微徽章（用于平台标签、计数等） */
  neutralBadge:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10.5px] font-medium bg-black/[0.045] dark:bg-white/[0.07] text-[#515154] dark:text-[#aeaeb2] border border-black/[0.05] dark:border-white/[0.06] shrink-0',
  /** 悬浮在微缩预览图上的半透明高可读中性微徽章 */
  previewOverlayBadge:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10.5px] font-medium bg-white/90 dark:bg-[#1c1c1e]/90 text-[#3a3a3c] dark:text-[#d1d1d6] border border-black/[0.08] dark:border-white/[0.12] shrink-0',
  /** 悬浮在预览图右下角的 macOS 扁平截图操作胶囊按钮 */
  previewActionPill:
    'inline-flex items-center gap-1 px-2 py-1 rounded-[7px] text-[10.5px] font-medium bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-sm text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.12] dark:border-white/[0.16] hover:border-[#0071e3] dark:hover:border-[#0a84ff] hover:text-[#0071e3] dark:hover:text-[#0a84ff] transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed',
  /** Apple System Blue 激活状态扁平胶囊 */
  activePill:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071e3] dark:bg-[#0a84ff] text-white shrink-0',
  /** Apple System Blue 主操作扁平按钮 */
  primaryButton:
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] dark:bg-[#0a84ff] dark:hover:bg-[#2894ff] active:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  /** 次级扁平描边按钮 */
  secondaryButton:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[9px] text-[12px] font-medium border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  /** 扁平图标小按钮（导出、打开目录等） */
  iconButton:
    'inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-[8px] text-[11.5px] font-medium text-[#515154] dark:text-[#aeaeb2] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed',
  /** 扁平输入框 */
  input:
    'w-full px-3 py-2 text-[12.5px] rounded-[9px] border border-black/[0.12] dark:border-white/[0.12] bg-[#f5f5f7]/60 dark:bg-[#141416] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] dark:placeholder-[#636366] focus:outline-none focus:bg-white dark:focus:bg-[#1c1c1e] focus:border-[#0071e3] dark:focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0071e3]/20 dark:focus:ring-[#0a84ff]/25 transition-all disabled:opacity-55 disabled:cursor-not-allowed',
  /** macOS 扁平搜索框 */
  searchInput:
    'w-full pl-9 pr-8 py-1.5 h-9 text-[12.5px] rounded-[9px] border border-black/[0.1] dark:border-white/[0.11] bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] dark:placeholder-[#636366] focus:outline-none focus:border-[#0071e3] dark:focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0071e3]/20 dark:focus:ring-[#0a84ff]/25 transition-all [&::-webkit-search-cancel-button]:hidden',
} as const;
