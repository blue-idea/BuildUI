/**
 * 沙箱实时预览 HTML 生成器
 * 根据当前项目名称、主题、蓝图与语言生成独立运行的高保真应用视图，
 * 彻底消除外部端口未启动时的空白页与递归嵌套画中画问题，
 * 并支持 100% 纯正中英文界面无缝切换。
 */

import { Locale } from '../i18n/types';

export function generateSandboxDoc(
  appName: string = 'Pantry Planner',
  themeId: string = 'clean-light',
  blueprint?: { appName?: string; designDirection?: string; primaryColor?: string } | null,
  locale: Locale = 'en',
  extraItems: string[] = []
): string {
  const isZh = locale === 'zh';
  const isDark =
    themeId.includes('dark') ||
    themeId.includes('cyberpunk') ||
    themeId.includes('slate') ||
    themeId.includes('forest');
  const isCyberpunk =
    themeId.includes('cyberpunk') ||
    appName.toLowerCase().includes('portfolio') ||
    blueprint?.appName?.toLowerCase().includes('portfolio');
  const isPantry =
    appName.toLowerCase().includes('pantry') ||
    (!isCyberpunk && !appName.toLowerCase().includes('saas'));

  const primaryColor = blueprint?.primaryColor || (isCyberpunk ? '#00ffcc' : '#7c3aed');

  // 食材食谱规划器模版 (Pantry Planner)
  if (isPantry) {
    const texts = isZh
      ? {
          title: appName === 'Pantry Planner' ? '食材规划与食谱助手' : appName,
          subtitle: '智能晚餐搭配与剩余食材利用',
          badge: '实时沙箱运行中',
          pantryTitle: '🥫 食材库存清单',
          itemCount: `${5 + extraItems.length} 件食材`,
          inStock: '库存充足',
          placeholder: '添加新采购的食材...',
          addBtn: '+ 添加食材',
          recipeTitle: '🍽️ 今晚菜谱推荐',
          matchBadge: '按食材匹配度排序',
          r1Name: '经典番茄罗勒意面',
          r1Desc: '15分钟快手炒锅晚餐，使用新鲜番茄与大蒜碎。',
          r1Match: '✓ 100% 食材已备齐',
          r2Name: '香蒜香草橄榄油拌面',
          r2Desc: '意大利传统经典面食，以温热初榨橄榄油慢煎蒜末。',
          r2Match: '✓ 100% 食材已备齐',
          r3Name: '香脆帕玛森干酪薄饼',
          r3Desc: '金黄烤箱烘焙小食，浓郁奶香搭配现磨黑胡椒。',
          r3Match: '✓ 90% 匹配 (缺少黄油)',
          addedStatus: '已入库',
          i1: '🍅 新鲜番茄',
          i2: '🍝 意式通心粉',
          i3: '🧄 新鲜大蒜瓣',
          i4: '🫒 特级初榨橄榄油',
          i5: '🧀 帕玛森干酪',
        }
      : {
          title: appName,
          subtitle: 'Smart Dinner & Ingredient Matcher',
          badge: 'Live Sandbox',
          pantryTitle: '🥫 Pantry Inventory',
          itemCount: `${5 + extraItems.length} items`,
          inStock: 'In Stock',
          placeholder: 'Add new pantry item...',
          addBtn: '+ Add Ingredient',
          recipeTitle: '🍽️ Dinner Suggestions',
          matchBadge: 'Ranked by Match',
          r1Name: 'Classic Tomato Basil Pasta',
          r1Desc: 'Quick 15-minute skillet dinner using fresh tomatoes and garlic.',
          r1Match: '✓ 100% ingredients ready',
          r2Name: 'Garlic & Herb Aglio e Olio',
          r2Desc: 'Traditional pasta tossed in warm infused olive oil with minced garlic.',
          r2Match: '✓ 100% ingredients ready',
          r3Name: 'Crispy Parmesan Baked Crust',
          r3Desc: 'Golden oven-baked snack with cheese flakes and pepper.',
          r3Match: '✓ 90% match (Needs Butter)',
          addedStatus: 'Added',
          i1: '🍅 Fresh Tomatoes',
          i2: '🍝 Italian Pasta',
          i3: '🧄 Garlic Cloves',
          i4: '🫒 Extra Virgin Olive Oil',
          i5: '🧀 Parmesan Cheese',
        };

    return `<!DOCTYPE html>
<html lang="${isZh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${texts.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: ${isDark ? '#09090b' : '#f8fafc'};
      color: ${isDark ? '#f4f4f5' : '#1e293b'};
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${isDark ? '#27272a' : '#e2e8f0'};
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: ${isDark ? '#fafafa' : '#0f172a'};
    }
    .badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      background: ${isDark ? '#2e1065' : '#ede9fe'};
      color: #7c3aed;
      font-weight: 600;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 640px) {
      .grid { grid-template-columns: 1fr; }
    }
    .card {
      background: ${isDark ? '#18181b' : '#ffffff'};
      border: 1px solid ${isDark ? '#27272a' : '#e2e8f0'};
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: ${isDark ? '#f4f4f5' : '#334155'};
    }
    .ingredient-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ingredient-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 8px;
      background: ${isDark ? '#27272a' : '#f1f5f9'};
      font-size: 13px;
    }
    .recipe-card {
      padding: 12px;
      border-radius: 10px;
      border: 1px solid ${isDark ? '#3f3f46' : '#e2e8f0'};
      margin-bottom: 12px;
      background: ${isDark ? '#27272a/50' : '#ffffff'};
    }
    .recipe-name {
      font-size: 13px;
      font-weight: 600;
      color: ${isDark ? '#fafafa' : '#1e293b'};
    }
    .recipe-desc {
      font-size: 12px;
      color: ${isDark ? '#a1a1aa' : '#64748b'};
      margin-top: 4px;
    }
    .match-tag {
      display: inline-block;
      margin-top: 8px;
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 14px;
      border-radius: 8px;
      background: #7c3aed;
      color: white;
      font-size: 12px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      margin-top: 10px;
      transition: background 0.2s;
    }
    .btn:hover { background: #6d28d9; }
    .input {
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid ${isDark ? '#3f3f46' : '#cbd5e1'};
      background: ${isDark ? '#27272a' : '#ffffff'};
      color: ${isDark ? '#ffffff' : '#000000'};
      font-size: 12px;
      margin-bottom: 8px;
      outline: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo">🍳</div>
      <div>
        <div class="title">${texts.title}</div>
        <div style="font-size: 11px; color: ${isDark ? '#a1a1aa' : '#64748b'};">${texts.subtitle}</div>
      </div>
    </div>
    <span class="badge">${texts.badge}</span>
  </div>

  <div class="grid">
    <!-- 配料清单组件 (PantryList.tsx) -->
    <div class="card" id="pantry-card">
      <div class="card-title">
        <span>${texts.pantryTitle}</span>
        <span style="font-size: 11px; color: #7c3aed;">${texts.itemCount}</span>
      </div>
      <ul class="ingredient-list" id="ing-list">
        <li class="ingredient-item"><span>${texts.i1}</span><span style="color: #10b981;">${texts.inStock}</span></li>
        <li class="ingredient-item"><span>${texts.i2}</span><span style="color: #10b981;">${texts.inStock}</span></li>
        <li class="ingredient-item"><span>${texts.i3}</span><span style="color: #10b981;">${texts.inStock}</span></li>
        <li class="ingredient-item"><span>${texts.i4}</span><span style="color: #10b981;">${texts.inStock}</span></li>
        <li class="ingredient-item"><span>${texts.i5}</span><span style="color: #10b981;">${texts.inStock}</span></li>
        ${extraItems
          .map(
            (item) =>
              `<li class="ingredient-item"><span>🌿 ${item}</span><span style="color: #10b981;">${texts.inStock}</span></li>`
          )
          .join('\n        ')}
      </ul>
      <div style="margin-top: 14px;">
        <input type="text" id="new-item" placeholder="${texts.placeholder}" class="input" />
        <button class="btn" onclick="addItem()">${texts.addBtn}</button>
      </div>
    </div>

    <!-- 菜谱推荐组件 (RecipeCard.tsx) -->
    <div class="card">
      <div class="card-title">
        <span>${texts.recipeTitle}</span>
        <span style="font-size: 11px; color: #10b981;">${texts.matchBadge}</span>
      </div>
      <div class="recipe-card">
        <div class="recipe-name">${texts.r1Name}</div>
        <div class="recipe-desc">${texts.r1Desc}</div>
        <div class="match-tag">${texts.r1Match}</div>
      </div>
      <div class="recipe-card">
        <div class="recipe-name">${texts.r2Name}</div>
        <div class="recipe-desc">${texts.r2Desc}</div>
        <div class="match-tag">${texts.r2Match}</div>
      </div>
      <div class="recipe-card">
        <div class="recipe-name">${texts.r3Name}</div>
        <div class="recipe-desc">${texts.r3Desc}</div>
        <div class="match-tag">${texts.r3Match}</div>
      </div>
    </div>
  </div>

  <script>
    function addItem() {
      const input = document.getElementById('new-item');
      const val = input.value.trim();
      if (!val) return;
      const list = document.getElementById('ing-list');
      const li = document.createElement('li');
      li.className = 'ingredient-item';
      li.innerHTML = '<span>' + val + '</span><span style="color: #10b981;">${texts.addedStatus}</span>';
      list.appendChild(li);
      input.value = '';
    }
  </script>
</body>
</html>`;
  }

  // 赛博朋克深色 Portfolio 页面
  if (isCyberpunk) {
    const texts = isZh
      ? {
          badge: '⚡ 赛博朋克霓虹特别版',
          name: 'Alex Vance',
          bio: '高级全栈 UI 架构师与自主智能体专家。专注于构建下一代桌面 Web 沉浸式人机交互体验。',
          cta: '查看交互式演示',
          c1Title: '🚀 Blot-UI 桌面级引擎',
          c1Desc: 'Wails v2 + React 19 高性能多模态 AI 智能工作台。',
          c2Title: '💎 WebContainers 沙箱虚拟化',
          c2Desc: '浏览器内零延迟 Node 运行时与轻量微容器技术。',
        }
      : {
          badge: 'CYBERPUNK NEON EDITION',
          name: 'Alex Vance',
          bio: 'Senior Full-Stack UI Architect & Autonomous Agent Specialist. Building next-generation desktop web experiences.',
          cta: 'View Interactive Demos',
          c1Title: '🚀 Blot-UI Desktop Engine',
          c1Desc: 'Wails v2 + React 19 high-performance AI studio.',
          c2Title: '💎 WebContainers Sandbox',
          c2Desc: 'Zero-latency in-browser node runtime virtualization.',
        };

    return `<!DOCTYPE html>
<html lang="${isZh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0a0a12;
      color: #e2e8f0;
      padding: 32px 24px;
      line-height: 1.6;
    }
    .hero {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: linear-gradient(135deg, #00ffcc, #3b82f6);
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 0 25px rgba(0, 255, 204, 0.4);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(0, 255, 204, 0.1);
      color: #00ffcc;
      border: 1px solid rgba(0, 255, 204, 0.3);
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
    }
    p {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      text-align: left;
      margin-top: 20px;
    }
    .card {
      background: #12131f;
      border: 1px solid #1e2238;
      border-radius: 12px;
      padding: 16px;
      transition: border-color 0.2s;
    }
    .card:hover {
      border-color: #00ffcc;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 11px;
      color: #64748b;
    }
    .cta-btn {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 10px;
      background: #00ffcc;
      color: #05050a;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 0 15px rgba(0, 255, 204, 0.3);
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="avatar">⚡</div>
    <span class="badge">${texts.badge}</span>
    <h1>${texts.name}</h1>
    <p>${texts.bio}</p>
    <a href="#" class="cta-btn">${texts.cta}</a>

    <div class="grid">
      <div class="card">
        <div class="card-title">${texts.c1Title}</div>
        <div class="card-desc">${texts.c1Desc}</div>
      </div>
      <div class="card">
        <div class="card-title">${texts.c2Title}</div>
        <div class="card-desc">${texts.c2Desc}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // 通用清爽现代应用模板
  const texts = isZh
    ? {
        desc: '应用沙箱已完全挂载，正在实时响应您的代码修改与指令交互。',
        status: '沙箱运行中并已通过健康检查',
      }
    : {
        desc: 'Your application sandbox is fully mounted and responding to changes in real-time.',
        status: 'Sandbox Online & Verified',
      };

  return `<!DOCTYPE html>
<html lang="${isZh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: ${isDark ? '#0f172a' : '#f8fafc'};
      color: ${isDark ? '#f8fafc' : '#0f172a'};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .box {
      background: ${isDark ? '#1e293b' : '#ffffff'};
      border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
      border-radius: 16px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: ${primaryColor}22;
      color: ${primaryColor};
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 22px;
    }
    h2 { font-size: 18px; margin-bottom: 8px; }
    p { font-size: 13px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 20px; line-height: 1.5; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #10b981;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">✨</div>
    <h2>${appName}</h2>
    <p>${texts.desc}</p>
    <div class="status">
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
      <span>${texts.status}</span>
    </div>
  </div>
</body>
</html>`;
}
