import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v13/reports/screenshots');

test.describe('Blot-UI v13 Visual Element Selection & Targeted Local AI Editing E2E', () => {
  test('Complete flow: Element Selection -> Code Region Localization -> Code View Jump -> Targeted AI Edit', async ({
    page,
  }) => {
    // 1. 进入应用构建器视图
    await page.goto('/');

    const builderDock = page.getByTestId('dock-builder');
    if (await builderDock.isVisible()) {
      await builderDock.click();
    }

    await expect(page.getByText('Chat & Blueprint', { exact: false })).toBeVisible();

    // 2. 激活组件审查模式
    const inspectBtn = page.getByRole('button', { name: /toggle component inspector/i });
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // 验证顶部审查条激活
    await expect(page.getByText('Inspector Mode Active:')).toBeVisible();

    // 截图 01: 审查模式激活
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v13-inspect-hover-highlight.png'),
      fullPage: true,
    });

    // 3. 点选界面中的目标元素 <button>
    const buttonTarget = page.getByTestId('inspect-target-button');
    await expect(buttonTarget).toBeVisible();
    await buttonTarget.click();

    // 验证弹出局部编辑控制器 LocalEditPopover
    const popover = page.getByTestId('local-edit-popover');
    await expect(popover).toBeVisible();
    await expect(popover.getByText('<button>')).toBeVisible();

    // 点击 View Code 展开完整代码区域
    const viewCodeBtn = page.getByRole('button', { name: /view code/i });
    if (await viewCodeBtn.isVisible()) {
      await viewCodeBtn.click();
    }

    // 截图 02: 锁定元素弹出局部编辑控制器（包含完整代码区域）
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v13-element-locked-popover.png'),
      fullPage: true,
    });

    // 4. 点击 Jump to Code 按钮
    const jumpToCodeBtn = page.getByRole('button', { name: /jump to code/i });
    await expect(jumpToCodeBtn).toBeVisible();
    await jumpToCodeBtn.click();

    // 验证右侧工作区切换到 Code 视图
    const codeLayout = page.getByTestId('code-review-layout');
    await expect(codeLayout).toBeVisible();

    // 截图 03: 切换到 Code 视图并高亮对应行
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v13-jump-to-code-view.png'),
      fullPage: true,
    });

    // 5. 切换回 Preview 视图并提交局部定向编辑指令
    const previewTab = page.getByTestId('tab-preview');
    await previewTab.click();

    // 若审查按钮未激活则激活
    if (!(await buttonTarget.isVisible())) {
      await inspectBtn.click();
    }
    await expect(buttonTarget).toBeVisible();
    await buttonTarget.click();
    await expect(popover).toBeVisible();

    // 点击 Change Color 药丸
    const colorPill = page.getByRole('button', { name: /change color/i });
    await colorPill.click();

    // 点击 Apply Edit 提交局部编辑
    const applyBtn = page.getByRole('button', { name: /apply edit/i });
    await applyBtn.click();

    // 验证 Popover 关闭，指令注入到 Chat 输入框
    await expect(popover).toBeHidden();
    const chatInput = page.getByPlaceholder(/describe what to build/i);
    await expect(chatInput).toBeVisible();
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toContain('Target');

    // 截图 04: 提交局部编辑后 Prompt 结构化注入完成
    await page.screenshot({
      path: path.join(screenshotsDir, '04-v13-targeted-prompt-submitted.png'),
      fullPage: true,
    });
  });
});
