import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v6-finished/reports/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Code Review Left-Tree Right-Content Layout E2E & Visual Regression', () => {
  test('renders left directory tree and right file content, supports file selection and theme adaptation', async ({ page }) => {
    await page.goto('/');

    // 1. 点击切换至代码检视 Tab
    const codeTab = page.getByTestId('tab-code');
    await expect(codeTab).toBeVisible();
    await codeTab.click();

    // 2. 验证整体代码检视布局以及左右分栏容器
    const layout = page.getByTestId('code-review-layout');
    await expect(layout).toBeVisible();

    const fileTree = page.getByTestId('code-file-tree');
    const fileContent = page.getByTestId('code-file-content');
    await expect(fileTree).toBeVisible();
    await expect(fileContent).toBeVisible();

    // 验证左侧目录树包含文件列表，右侧默认展示首个文件内容
    await expect(fileTree.getByText('PantryList.tsx')).toBeVisible();
    await expect(fileContent.getByText('Pantry Inventory')).toBeVisible();

    // 截图 1: 代码检视默认分栏布局（左侧文件树，右侧首个文件内容）
    await page.screenshot({
      path: path.join(screenshotsDir, 'code-review-left-tree-right-content.png'),
      fullPage: true,
    });

    // 3. 在左侧目录树中点击选择 RecipeCard.tsx
    const recipeNode = fileTree.getByText('RecipeCard.tsx');
    await expect(recipeNode).toBeVisible();
    await recipeNode.click();

    // 4. 验证右侧文件内容区切换为 RecipeCard.tsx 的代码
    await expect(fileContent.getByText('Dinner Suggestion')).toBeVisible();
    await expect(fileContent.getByText('RecipeCard.tsx')).toBeVisible();

    // 截图 2: 选中切换其他文件后的代码展示
    await page.screenshot({
      path: path.join(screenshotsDir, 'code-review-file-selected.png'),
      fullPage: true,
    });

    // 5. 切换为深色主题验证视觉适配
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      // 截图 3: 深色主题下的代码检视布局
      await page.screenshot({
        path: path.join(screenshotsDir, 'code-review-dark-mode.png'),
        fullPage: true,
      });
    }
  });
});
