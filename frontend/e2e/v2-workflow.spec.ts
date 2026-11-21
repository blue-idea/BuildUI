import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// 截图保存路径至 v2 reports/screenshots 目录
const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v2/reports/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Blot-UI v2 Full Lifecycle E2E Workflow', () => {
  test('Complete v2 workflow: Workspace Picker -> Settings -> Multi-Turn Gen -> Time Machine Diff & Rollback', async ({
    page,
  }) => {
    // 1. 访问首页，验证初始布局与原生工作区选择器
    await page.goto('/');
    await expect(page.getByText('Blot-UI', { exact: true })).toBeVisible();
    await expect(page.getByText('Wails v2 + React 19')).toBeVisible();

    // 验证原生工作区目录选择器存在并测试点击切换目录
    const workspaceBtn = page.getByRole('button', { name: /select workspace directory/i });
    await expect(workspaceBtn).toBeVisible();
    await workspaceBtn.click();
    await expect(page.getByText(/Workspace:/i)).toBeVisible();

    // 2. 打开设置面板并配置真实/模拟 LLM Provider
    const settingsBtn = page.getByRole('button', { name: /open settings/i });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    await expect(page.getByText('LLM Provider Settings')).toBeVisible();

    const baseUrlInput = page.getByPlaceholder('https://api.openai.com/v1');
    await baseUrlInput.fill('https://api.openai.com/v1');

    const apiKeyInput = page.getByPlaceholder('sk-...');
    await apiKeyInput.fill('sk-test-v2-mock-key-12345');

    const modelInput = page.getByPlaceholder('gpt-4o');
    await modelInput.fill('gpt-4o');

    // 测试连通性
    const testConnBtn = page.getByRole('button', { name: /test connection/i });
    await testConnBtn.click();
    await expect(page.getByText('Connection established successfully')).toBeVisible();

    // 截图 1: 设置面板配置与连通性测试通过
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v2-main-settings.png'),
      fullPage: true,
    });

    // 保存设置并验证关闭模态框
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('LLM Provider Settings')).not.toBeVisible();

    // 3. 第一轮生成需求：蓝图审批门禁与代码生成落盘
    const chatInput = page.getByPlaceholder('Describe what to build...');
    await chatInput.fill('Create a modern crypto portfolio tracker');
    await page.getByRole('button', { name: 'Send prompt' }).click();

    // 验证用户消息已上屏
    await expect(page.getByText('Create a modern crypto portfolio tracker')).toBeVisible();

    // 蓝图审批卡片展示
    await expect(page.getByText('Application Design Blueprint')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Pending Approval')).toBeVisible();

    // 批准蓝图
    const approveBtn = page.getByRole('button', { name: 'Approve Blueprint & Start Generation' });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // 验证审批通过与代码生成沙箱验证通知
    await expect(page.getByText('Blueprint Approved', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Application code generated and verified in local sandbox')
    ).toBeVisible({ timeout: 5000 });

    // 截图 2: 第一轮蓝图审批通过与代码生成
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v2-round1-blueprint-approved.png'),
      fullPage: true,
    });

    // 4. 第二轮增量修改：多轮上下文与可中断控制
    await chatInput.fill('Add a real-time price ticker widget with candle chart');
    await page.getByRole('button', { name: 'Send prompt' }).click();

    // 验证第二轮用户消息展示
    await expect(
      page.getByText('Add a real-time price ticker widget with candle chart')
    ).toBeVisible();

    // 验证第二轮增量生成完成
    await expect(
      page.getByText('Updated components based on your request: "Add a real-time price ticker widget with candle chart"')
    ).toBeVisible({ timeout: 5000 });

    // 截图 3: 第二轮多轮增量生成完成
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v2-round2-multiturn-chat.png'),
      fullPage: true,
    });

    // 5. 版本时光机、代码 Diff 审查与一键回滚
    const versionsBtn = page.getByRole('button', { name: /open version time machine/i });
    await expect(versionsBtn).toBeVisible();
    await versionsBtn.click();

    await expect(page.getByText('Version Time Machine')).toBeVisible();
    await expect(page.getByText('03176f3')).toBeVisible();

    // 点击版本快照，加载 Diff 详情
    const versionItem = page.getByRole('button', { name: /select version 03176f3/i });
    await expect(versionItem).toBeVisible();
    await versionItem.click();
    await expect(page.getByText('Commit: 03176f3')).toBeVisible();
    await expect(page.getByText('src/App.tsx')).toBeVisible();

    // 截图 4: 版本时光机与行级 Diff 对比
    await page.screenshot({
      path: path.join(screenshotsDir, '04-v2-version-timeline-diff.png'),
      fullPage: true,
    });

    // 点击回滚并验证模态框关闭
    const rollbackBtn = page.getByRole('button', { name: /rollback to this version/i });
    await expect(rollbackBtn).toBeVisible();
    await rollbackBtn.click();
    await expect(page.getByText('Version Time Machine')).not.toBeVisible();

    // 验证回滚通知呈现在聊天流中，且预览正常
    await expect(
      page.getByText('Successfully rolled back to version 03176f3')
    ).toBeVisible();
    await expect(page.locator('iframe[title="App live preview"]')).toBeVisible();

    // 截图 5: 回滚成功后的主界面与预览
    await page.screenshot({
      path: path.join(screenshotsDir, '05-v2-rollback-preview.png'),
      fullPage: true,
    });
  });
});
