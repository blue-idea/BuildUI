import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v31/reports/screenshots');

test.describe('BuildUI v31 Clarification, Left-Pane Polish, Local Edit & Locale Alignment', () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  });

  test('renders localized clarification option cards, blueprint card, clean local edit bubble, and dark/en views', async ({
    page,
  }) => {
    // 1. 中文模式下进入构建区，验证初始美化聊天气泡与空态/演示态
    await page.addInitScript(() => {
      localStorage.setItem('blot_locale', 'zh');
      localStorage.setItem('blot_theme_mode', 'light');
    });

    await page.goto('/');
    await page.getByTestId('dock-builder').click();
    await expect(page.getByText('对话与蓝图')).toBeVisible();

    // 2. 触发澄清选项卡片并截图（浅色 + 中文）
    const mockQBtn = page.getByRole('button', { name: /mock questionnaire/i });
    await mockQBtn.click();

    const questionnaireCard = page.getByTestId('questionnaire-card');
    await expect(questionnaireCard).toBeVisible();
    await expect(questionnaireCard.getByText('需求与设计澄清')).toBeVisible();
    await questionnaireCard.getByText('首页总览看板').click();
    await questionnaireCard.getByText(/多页分栏导航/).click();
    await questionnaireCard.getByText('深邃科技暗黑').click();

    await page.screenshot({
      path: path.join(screenshotsDir, '01-v31-zh-clarification-card.png'),
      fullPage: true,
    });

    // 3. 提交澄清选择 -> 展示美化后的偏好摘要气泡与明暗自适应蓝图卡片
    await page.getByTestId('questionnaire-submit-btn').click();
    await expect(page.getByText('已确认设计偏好')).toBeVisible();
    const blueprintCard = page.getByTestId('blueprint-card');
    await expect(blueprintCard).toBeVisible();
    await expect(blueprintCard.getByText('待审批')).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotsDir, '02-v31-zh-blueprint-card.png'),
      fullPage: true,
    });

    // 4. 批准蓝图后开启局部编辑，验证中文化 LocalEditPopover、定位芯片与无大段源码气泡
    await blueprintCard.getByRole('button', { name: /批准蓝图/i }).click();
    await expect(blueprintCard.getByText('已批准', { exact: true })).toBeVisible();

    const inspectBtn = page.getByRole('button', { name: /toggle component inspector/i });
    await inspectBtn.click();
    await page.getByTestId('inspect-target-button').click();

    const popover = page.getByTestId('local-edit-popover');
    await expect(popover).toBeVisible();
    await popover.getByRole('button', { name: '调整配色' }).click();
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v31-zh-local-edit-popover.png'),
      fullPage: true,
    });
    await popover.getByRole('button', { name: '应用局部修改' }).click();

    await expect(popover).toBeHidden();
    const chip = page.getByTestId('local-edit-context-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('RecipeCard.tsx');

    // 发送局部修改请求并校验左侧气泡中不暴露代码片段
    await page.getByRole('button', { name: 'Send prompt' }).click();
    await expect(page.getByText('Original Code Snippet')).toHaveCount(0);
    await expect(page.getByText('局部修改').first()).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotsDir, '04-v31-zh-local-edit-clean.png'),
      fullPage: true,
    });

    // 5. 切换至英文 + 暗色主题，验证全界面双语与暗色自适应
    await page.getByRole('button', { name: /switch to dark mode/i }).click();
    await page.getByRole('button', { name: /switch to english/i }).click();
    await expect(page.getByText('Chat & Blueprint')).toBeVisible();
    await expect(blueprintCard.getByText('Approved', { exact: true })).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotsDir, '05-v31-en-dark-builder.png'),
      fullPage: true,
    });
  });
});
