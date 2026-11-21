import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// 截图保存路径至 v5-finished reports/screenshots 目录
const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v5-finished/reports/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Blot-UI v5 Full Lifecycle E2E Workflow', () => {
  test('Complete v5 workflow: Template Center Instantiation -> Ctrl+K Command Palette -> Fuzzy Search & Quick Execution', async ({
    page,
  }) => {
    // 1. 访问首页，验证初始布局与头部导航栏 Commands 按钮
    await page.goto('/');
    await expect(page.getByText('Blot-UI', { exact: true })).toBeVisible();
    await expect(page.getByText('Wails v2 + React 19')).toBeVisible();

    const cmdBtn = page.getByRole('button', { name: /open command palette/i });
    await expect(cmdBtn).toBeVisible();

    // 2. 打开 Apps 抽屉并进入模版中心
    const appsBtn = page.getByRole('button', { name: /open applications drawer/i });
    await expect(appsBtn).toBeVisible();
    await appsBtn.click();

    const browseTmplBtn = page.getByRole('button', { name: /browse templates/i });
    await expect(browseTmplBtn).toBeVisible();
    await browseTmplBtn.click();

    // 验证模版中心弹窗呈现
    await expect(page.getByText('Application Templates')).toBeVisible();
    await expect(page.getByText('SaaS Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Creative Developer Portfolio')).toBeVisible();

    // 截图 1: 模版中心模态框与预置模版卡片
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v5-template-modal.png'),
      fullPage: true,
    });

    // 3. 点击一键使用 SaaS Analytics Dashboard 模版
    const useBtns = page.getByRole('button', { name: /use template saas analytics dashboard/i });
    await expect(useBtns).toBeVisible();
    await useBtns.click();

    // 验证模版弹窗关闭，工作区自动加载新项目
    await expect(page.getByText('Application Templates')).not.toBeVisible();
    await expect(page.getByText('/workspace/saas-dashboard')).toBeVisible();

    // 截图 2: 模版脚手架一键实例化与新工程加载
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v5-template-instantiated.png'),
      fullPage: true,
    });

    // 4. 打开全局命令面板 (Command Palette)
    await cmdBtn.click();
    await expect(page.getByPlaceholder(/type a command or search/i)).toBeVisible();

    // 截图 3: 全局命令面板唤起与焦点捕获
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v5-command-palette-open.png'),
      fullPage: true,
    });

    // 5. 模糊输入 "cyber" 检索切换主题命令并回车执行
    const searchInput = page.getByPlaceholder(/type a command or search/i);
    await searchInput.fill('cyber');

    await expect(page.getByText('Switch Theme: Cyberpunk Neon')).toBeVisible();
    await searchInput.press('Enter');

    // 验证命令面板已关闭，且 Cyberpunk Neon 主题已生效
    await expect(page.getByPlaceholder(/type a command or search/i)).not.toBeVisible();
    await expect(page.getByText('Cyberpunk Neon')).toBeVisible();

    // 截图 4: 命令执行完成与全局主题瞬时切换
    await page.screenshot({
      path: path.join(screenshotsDir, '04-v5-command-executed.png'),
      fullPage: true,
    });
  });
});
