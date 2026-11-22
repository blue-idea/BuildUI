# 技术设计方案（Design）· Blot-UI v9

> 文件路径：`docs/spec/versions/v9/design.md`  
> 规范版本：v9 · 日期：2026-11-22  
> 状态：定稿实施中（active）  
> 关联需求：[docs/spec/versions/v9/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v9/requirements.md)

---

## 1. 架构与组件设计

根据用户提供的设计参考截图以及 Blot-UI 的现代 macOS 风格规范，本次设计实现独立的 `ComponentCenterView` 组件，并在 `App.tsx` 的工作区主容器中与 `LeftDock` 完美打通。

```
LeftDock (dock-components) ──> activeDockTab = 'components'
                                      │
                                      ▼
                             ComponentCenterView
   ┌────────────────────────────────────────────────────────────────────────┐
   │ Header: ← Go Back | Plugins (Title & Subtitle) | [+ Add Plugin] Button │
   ├────────────────────────────────────────────────────────────────────────┤
   │ Installed Summary & Section:                                           │
   │ "0 plugins · 0 tools enabled" | "No plugins added yet." / Plugin Cards │
   ├────────────────────────────────────────────────────────────────────────┤
   │ Add from catalog Header & Search:                                      │
   │ "Add from catalog" | "Curated plugins..." | [Search catalog...]        │
   ├────────────────────────────────────────────────────────────────────────┤
   │ Categories:                                                            │
   │  ☆ Featured                                                            │
   │    [ Stripe OAuth ]       [ Vercel OAuth ]                             │
   │  AI & Media                                                            │
   │    [ Hugging Face ] [ HeyGen ] [ Higgsfield ] [ Roboflow ] [ Braintrust]│
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型定义

在 `frontend/src/types/plugin.ts` 中抽象统一的数据模型：

```typescript
export interface PluginItem {
  id: string;
  name: string;
  badge?: string; // e.g., 'OAuth', 'STDIO', 'SSE'
  description: string;
  domain: string;
  category: 'featured' | 'ai_media' | 'developer' | 'custom';
  iconColor?: string;
  iconBg?: string;
  toolsCount: number;
  isInstalled?: boolean;
  enabled?: boolean;
}

export interface CatalogCategory {
  id: string;
  title: string;
  icon?: string;
  plugins: PluginItem[];
}
```

---

## 3. 内置精选插件预设库（Default Catalog Preset）

预设数据严格匹配参考设计图：
- **Featured**:
  - `stripe`: Stripe OAuth · Manage payments, customers, and products · mcp.stripe.com
  - `vercel`: Vercel OAuth · Manage deployments and projects · mcp.vercel.com
- **AI & Media**:
  - `huggingface`: Hugging Face OAuth · Search models, datasets, and papers · huggingface.co
  - `heygen`: HeyGen OAuth · AI avatar videos · mcp.heygen.com
  - `higgsfield`: Higgsfield OAuth · AI video generation · mcp.higgsfield.ai
  - `roboflow`: Roboflow OAuth · Computer vision models · mcp.roboflow.com
  - `braintrust`: Braintrust OAuth · LLM evals and observability · api.braintrust.dev

---

## 4. 交互与状态流设计

1. **页面切换与返回**：
   - `App.tsx` 记录 `previousDockTab`（默认为 `'builder'` 或 `'home'`）；
   - 用户在 `LeftDock` 点击 `components` 时触发 `onSelectTab('components')`；
   - 在 `ComponentCenterView` 顶部点击 `Go Back` 时回调 `onGoBack()`，切回 `previousDockTab`。
2. **已安装插件与工具计算**：
   - `installedPlugins` 数组维护当前已启用的插件列表；
   - 统计公式：`pluginsCount = installedPlugins.length`，`toolsCount = sum(p.toolsCount for p in installedPlugins if p.enabled)`；
   - 空状态显示：若 `installedPlugins.length === 0`，渲染浅灰色圆角卡片，提示 `No plugins added yet.`。
3. **目录搜索过滤**：
   - 本地状态 `searchQuery`；
   - 过滤逻辑：匹配 `name`, `description`, `domain`；
   - 分类若在过滤后没有任何子插件匹配，则该分类容器平滑折叠隐藏；若全量无匹配，展示无搜索结果提示。
4. **自定义添加插件弹窗**：
   - 状态 `isAddModalOpen` 控制显示；
   - 表单字段包含：`name` (必填), `domain/command` (必填), `description` (选填), `toolsCount` (默认 1)；
   - 提交验证通过后将新插件加入已安装列表中。

---

## 5. 主题与样式规范

- 采用 Tailwind CSS 类实现极致响应式与美学；
- 按钮采用类似截图中优雅的高级紫色渐变/主题色：`bg-indigo-600 hover:bg-indigo-700 text-white` 或主题联动色；
- 卡片圆角 `rounded-2xl`，微投影 `shadow-xs border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900`；
- 图标采用 Lucide React 配合纯 CSS/SVG 定制徽标，完全零冗余包依赖；
- 全量适配 Dark Mode 与浅色模式。
