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
