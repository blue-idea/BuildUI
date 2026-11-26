import { expect, test } from '@playwright/test';

test('重开模板中心后保留选中的 Next.js 并命名创建', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByTestId('dock-templates').click();
  await expect(page.getByRole('heading', { name: 'Official templates' })).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole('heading', { name: /^(Community|Example) templates$/ })).toHaveCount(0);
  await expect(page.getByTestId(/^template-card-/)).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'React Native (Expo)' })).toBeVisible();
  await page.getByTestId('use-template-next').click();
  await expect(page.getByTestId('template-card-next')).toContainText('Selected');
  await page.reload();
  await page.getByTestId('dock-templates').click();
  await expect(page.getByTestId('template-card-next')).toContainText('Selected');
  await page.getByTestId('template-card-next').getByRole('button', { name: 'Create App' }).click();
  await page.getByRole('textbox', { name: 'Project name' }).fill('Sample AI App');
  await page.screenshot({ path: testInfo.outputPath('next-create.png') });
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: 'Application Templates' })).toHaveCount(0);
});

test('模板中心的 Desktop 分类仅显示 React 并创建 Desktop 工程', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByTestId('dock-templates').click();
  await page.getByTestId('platform-tab-web').click();
  await expect(page.getByTestId('template-card-react')).toBeVisible();
  await expect(page.getByTestId('template-card-next')).toBeVisible();
  await page.getByTestId('platform-tab-desktop').click();

  const react = page.getByTestId('template-card-react');
  await expect(page.getByTestId(/^template-card-/)).toHaveCount(1);
  await expect(react.getByText('Desktop', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('desktop-react-template.png') });
  await react.getByRole('button', { name: 'Create App' }).click();
  await page.getByRole('textbox', { name: 'Project name' }).fill('Sample AI App');
  await page.getByRole('button', { name: 'Create project' }).click();

  await page.getByTestId('dock-projects').click();
  await page.getByTestId('project-filter-desktop').click();
  await expect(page.getByRole('heading', { name: 'Sample AI App' })).toBeVisible();
});
