import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// 截图保存路径至 v3-finished reports/screenshots 目录
const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v3-finished/reports/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Blot-UI v3 Full Lifecycle E2E Workflow', () => {
  test('Complete v3 workflow: Multi-App Drawer -> Component Inspector Prompt Injection -> Project ZIP Export & File Manager Reveal', async ({
    page,
  }) => {
    // 1. 访问首页，验证初始布局与头部导航按钮
    await page.goto('/');
    await expect(page.getByText('Blot-UI', { exact: true })).toBeVisible();
    await expect(page.getByText('Wails v2 + React 19')).toBeVisible();

    // 2. 打开多应用抽屉并验证现有应用列表与新建应用能力
    const appsBtn = page.getByRole('button', { name: /open applications drawer/i });
    await expect(appsBtn).toBeVisible();
    await appsBtn.click();

    await expect(page.getByText('Applications', { exact: true })).toBeVisible();
    await expect(page.getByText('Default Application')).toBeVisible();
    const newAppBtn = page.getByRole('button', { name: 'New Application' });
    await expect(newAppBtn).toBeVisible();

    // 截图 1: 多应用抽屉与应用列表
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v3-app-drawer.png'),
      fullPage: true,
    });

    // 点击创建新应用，验证新工作区自动激活
    await newAppBtn.click();
    await expect(page.getByText('Applications', { exact: true })).not.toBeVisible();
    await expect(page.getByText(/Workspace:/i)).toBeVisible();
    await expect(page.getByText('/workspace/project-2')).toBeVisible();

    // 3. 开启预览区组件审查模式
    const inspectBtn = page.getByRole('button', { name: /toggle component inspector/i });
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // 验证审查模式状态栏上屏
    await expect(page.getByText('Inspector Mode Active:')).toBeVisible();
    await expect(
      page.getByText('Click any preview element to inspect source component and inject prompt')
    ).toBeVisible();

    // 截图 2: 预览区组件审查模式高亮与控制栏
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v3-component-inspector.png'),
      fullPage: true,
    });

    // 4. 点击检查 Navbar 元素，自动关闭审查模式并注入精准定位 prompt
    const mockNavbarBtn = page.getByRole('button', { name: /inspect navbar element/i });
    await expect(mockNavbarBtn).toBeVisible();
    await mockNavbarBtn.click();

    // 验证审查模式已退出
    await expect(page.getByText('Inspector Mode Active:')).not.toBeVisible();

    // 验证输入框已自动注入 @src/components/Navbar.tsx:
    const chatInput = page.getByPlaceholder('Describe what to build...');
    await expect(chatInput).toHaveValue('@src/components/Navbar.tsx: ');

    // 追加修改指令并发送
    await chatInput.fill('@src/components/Navbar.tsx: Change brand color to electric violet');
    
    // 截图 3: 精准组件引用 Prompt 注入
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v3-targeted-prompt.png'),
      fullPage: true,
    });

    await page.getByRole('button', { name: 'Send prompt' }).click();
    await expect(
      page.getByText('@src/components/Navbar.tsx: Change brand color to electric violet')
    ).toBeVisible();

    // 5. 打开工程导出面板，执行 ZIP 打包与定位目录
    const exportBtn = page.getByRole('button', { name: /open export modal/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    await expect(page.getByText('Export Project')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Project 2')).toBeVisible();

    // 点击导出为 ZIP
    const exportZipBtn = page.getByRole('button', { name: /export as zip/i });
    await expect(exportZipBtn).toBeVisible();
    await exportZipBtn.click();

    // 验证成功导出路径与在文件管理器中定位按钮
    await expect(page.getByText('Exported successfully to:')).toBeVisible({ timeout: 5000 });
    const revealBtn = page.getByRole('button', { name: /reveal in (file manager|explorer)/i });
    await expect(revealBtn).toBeVisible();

    // 截图 4: 一键 ZIP 导出与资源管理器打开
    await page.screenshot({
      path: path.join(screenshotsDir, '04-v3-project-export.png'),
      fullPage: true,
    });

    // 关闭导出面板
    const closeExportBtn = page.getByRole('button', { name: /close export modal/i });
    await closeExportBtn.click();
    await expect(page.getByText('Export Project')).not.toBeVisible();
  });
});
