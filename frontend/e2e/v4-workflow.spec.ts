import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// 截图保存路径至 v4-finished reports/screenshots 目录
const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v4-finished/reports/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Blot-UI v4 Full Lifecycle E2E Workflow', () => {
  test('Complete v4 workflow: Theme Engine Switching -> Dynamic CSS Token Injection -> Sandbox Dependency Installation Feedback', async ({
    page,
  }) => {
    // 1. 访问首页，验证初始布局与导航栏 ThemeSelector
    await page.goto('/');
    await expect(page.getByText('Blot-UI', { exact: true })).toBeVisible();
    await expect(page.getByText('Wails v2 + React 19')).toBeVisible();

    // 2. 展开主题选择器并验证高质量预设集合
    const themeBtn = page.getByRole('button', { name: /select theme/i });
    await expect(themeBtn).toBeVisible();
    await expect(page.getByText('Midnight Slate')).toBeVisible();

    await themeBtn.click();
    await expect(page.getByText('Presets')).toBeVisible();
    await expect(page.getByText('Cyberpunk Neon')).toBeVisible();
    await expect(page.getByText('Forest Emerald')).toBeVisible();
    await expect(page.getByText('Sunset Glow')).toBeVisible();
    await expect(page.getByText('Minimalist Light')).toBeVisible();

    // 截图 1: 主题下拉菜单与预设色盘
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v4-theme-selector-dropdown.png'),
      fullPage: true,
    });

    // 3. 切换至 Cyberpunk Neon 主题
    await page.getByText('Cyberpunk Neon').click();
    await expect(page.getByText('Cyberpunk Neon')).toBeVisible();

    // 截图 2: Cyberpunk Neon 激活与色标渲染
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v4-theme-cyberpunk-active.png'),
      fullPage: true,
    });

    // 4. 再次切换至 Forest Emerald 主题
    await themeBtn.click();
    await page.getByText('Forest Emerald').click();
    await expect(page.getByText('Forest Emerald')).toBeVisible();

    // 截图 3: Forest Emerald 激活与样式联动
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v4-theme-forest-active.png'),
      fullPage: true,
    });

    // 5. 触发包含现代第三方依赖包的前端需求生成
    const chatInput = page.getByPlaceholder('Describe what to build...');
    await chatInput.fill('Create an interactive analytics dashboard using recharts and lucide-react');
    await page.getByRole('button', { name: 'Send prompt' }).click();

    // 验证用户需求已上屏
    await expect(
      page.getByText('Create an interactive analytics dashboard using recharts and lucide-react')
    ).toBeVisible();

    // 验证依赖检测与自动安装状态卡片呈现
    await expect(
      page.getByText(/Installed dependencies: lucide-react, recharts/i)
    ).toBeVisible({ timeout: 5000 });

    // 截图 4: 依赖检测、自动安装进度与成功徽标反馈
    await page.screenshot({
      path: path.join(screenshotsDir, '04-v4-dependency-installation-stream.png'),
      fullPage: true,
    });
  });
});
