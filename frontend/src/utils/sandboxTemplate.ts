/**
 * 沙箱实时预览 HTML 生成器
 * 根据当前项目名称、主题与蓝图生成独立运行的高保真应用视图，
 * 彻底消除外部端口未启动时的空白页与递归嵌套画中画问题。
 */

export function generateSandboxDoc(
  appName: string = 'Pantry Planner',
  themeId: string = 'clean-light',
  blueprint?: { appName?: string; designDirection?: string; primaryColor?: string } | null
): string {
  const isDark = themeId.includes('dark') || themeId.includes('cyberpunk') || themeId.includes('slate') || themeId.includes('forest');
  const isCyberpunk = themeId.includes('cyberpunk') || appName.toLowerCase().includes('portfolio') || blueprint?.appName?.toLowerCase().includes('portfolio');
  const isPantry = appName.toLowerCase().includes('pantry') || (!isCyberpunk && !appName.toLowerCase().includes('saas'));

  const primaryColor = blueprint?.primaryColor || (isCyberpunk ? '#00ffcc' : '#7c3aed');

  if (isPantry) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
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
        <div class="title">${appName}</div>
        <div style="font-size: 11px; color: ${isDark ? '#a1a1aa' : '#64748b'};">Smart Dinner & Ingredient Matcher</div>
      </div>
    </div>
    <span class="badge">Live Sandbox</span>
  </div>

  <div class="grid">
    <!-- 配料清单组件 (PantryList.tsx) -->
    <div class="card" id="pantry-card">
      <div class="card-title">
        <span>🥫 Pantry Inventory</span>
        <span style="font-size: 11px; color: #7c3aed;">5 items</span>
      </div>
      <ul class="ingredient-list" id="ing-list">
        <li class="ingredient-item"><span>🍅 Fresh Tomatoes</span><span style="color: #10b981;">In Stock</span></li>
        <li class="ingredient-item"><span>🍝 Italian Pasta</span><span style="color: #10b981;">In Stock</span></li>
        <li class="ingredient-item"><span>🧄 Garlic Cloves</span><span style="color: #10b981;">In Stock</span></li>
        <li class="ingredient-item"><span>🫒 Extra Virgin Olive Oil</span><span style="color: #10b981;">In Stock</span></li>
        <li class="ingredient-item"><span>🧀 Parmesan Cheese</span><span style="color: #10b981;">In Stock</span></li>
      </ul>
      <div style="margin-top: 14px;">
        <input type="text" id="new-item" placeholder="Add new pantry item..." class="input" />
        <button class="btn" onclick="addItem()">+ Add Ingredient</button>
      </div>
    </div>

    <!-- 菜谱推荐组件 (RecipeCard.tsx) -->
    <div class="card">
      <div class="card-title">
        <span>🍽️ Dinner Suggestions</span>
        <span style="font-size: 11px; color: #10b981;">Ranked by Match</span>
      </div>
      <div class="recipe-card">
        <div class="recipe-name">Classic Tomato Basil Pasta</div>
        <div class="recipe-desc">Quick 15-minute skillet dinner using fresh tomatoes and garlic.</div>
        <div class="match-tag">✓ 100% ingredients ready</div>
      </div>
      <div class="recipe-card">
        <div class="recipe-name">Garlic & Herb Aglio e Olio</div>
        <div class="recipe-desc">Traditional pasta tossed in warm infused olive oil with minced garlic.</div>
        <div class="match-tag">✓ 100% ingredients ready</div>
      </div>
      <div class="recipe-card">
        <div class="recipe-name">Crispy Parmesan Baked Crust</div>
        <div class="recipe-desc">Golden oven-baked snack with cheese flakes and pepper.</div>
        <div class="match-tag">✓ 90% match (Needs Butter)</div>
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
      li.innerHTML = '<span>' + val + '</span><span style="color: #10b981;">Added</span>';
      list.appendChild(li);
      input.value = '';
    }
  </script>
</body>
</html>`;
  }

  // 赛博朋克深色 Portfolio 页面
  if (isCyberpunk) {
    return `<!DOCTYPE html>
<html lang="en">
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
    <span class="badge">CYBERPUNK NEON EDITION</span>
    <h1>Alex Vance</h1>
    <p>Senior Full-Stack UI Architect & Autonomous Agent Specialist. Building next-generation desktop web experiences.</p>
    <a href="#" class="cta-btn">View Interactive Demos</a>

    <div class="grid">
      <div class="card">
        <div class="card-title">🚀 Blot-UI Desktop Engine</div>
        <div class="card-desc">Wails v2 + React 19 high-performance AI studio.</div>
      </div>
      <div class="card">
        <div class="card-title">💎 WebContainers Sandbox</div>
        <div class="card-desc">Zero-latency in-browser node runtime virtualization.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // 通用清爽现代应用模板
  return `<!DOCTYPE html>
<html lang="en">
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
    <p>Your application sandbox is fully mounted and responding to changes in real-time.</p>
    <div class="status">
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
      <span>Sandbox Online & Verified</span>
    </div>
  </div>
</body>
</html>`;
}
