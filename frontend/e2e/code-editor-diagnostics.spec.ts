import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v8/reports/screenshots');

test.describe('Workspace Code Editor & Diagnostics Navigation E2E & Visual Regression', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('renders lightweight syntax highlighting, line numbers gutter, and jumps on diagnostic click', async ({ page }) => {
    await page.goto('/');

    // 1. 点击切换至代码检视 Tab
    const codeTab = page.getByTestId('tab-code');
    await expect(codeTab).toBeVisible();
    await codeTab.click();

    // 2. 验证整体代码检视布局以及 CodeEditorViewer 行号栏与分词高亮
    const layout = page.getByTestId('code-review-layout');
    await expect(layout).toBeVisible();

    const codeViewer = page.getByTestId('code-editor-viewer');
    await expect(codeViewer).toBeVisible();

    // 验证第 1 行行号指示栏
    const lineNum1 = page.getByTestId('code-line-number-1');
    await expect(lineNum1).toBeVisible();
    await expect(lineNum1).toHaveText('1');

    // 验证存在高亮 token
    const tokenKeyword = page.getByTestId('token-keyword').first();
    await expect(tokenKeyword).toBeVisible();

    // 截图 1: 浅色主题（Light Mode）下轻量级代码语法高亮与行号指示栏呈现
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v8-code-editor-light-mode.png'),
      fullPage: true,
    });

    // 3. 验证诊断问题面板（Diagnostics Panel）
    const diagPanel = page.getByTestId('diagnostics-panel');
    await expect(diagPanel).toBeVisible();

    const diagItem = page.getByTestId('diagnostic-item-0');
    await expect(diagItem).toBeVisible();
    await expect(diagItem).toContainText('RecipeCard.tsx');

    // 4. 点击诊断项执行一键跳转
    await diagItem.click();

    // 5. 验证自动切换当前文件并高亮目标代码行
    const fileContent = page.getByTestId('code-file-content');
    await expect(fileContent.getByText('src/components/RecipeCard.tsx', { exact: true })).toBeVisible();

    const targetLine = page.getByTestId('code-line-3');
    await expect(targetLine).toBeVisible();
    await expect(targetLine).toHaveAttribute('data-highlighted-line', 'true');

    // 截图 2: 浅色主题（Light Mode）下点击诊断项后自动切换文件并高亮定位错误代码行
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v8-diagnostics-jump-light.png'),
      fullPage: true,
    });

    // 6. 切换至深色主题（Dark Mode）并捕获深色视觉效果
    const themeToggle = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      // 截图 3: 深色主题（Dark Mode）下诊断面板与代码编辑器的自适应视觉呈现
      await page.screenshot({
        path: path.join(screenshotsDir, '03-v8-editor-dark-mode.png'),
        fullPage: true,
      });

      // 验证深色主题下暗色类生效
      await expect(page.locator('html')).toHaveClass(/dark/);
    }
  });
});
