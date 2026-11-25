import { expect, test } from '@playwright/test';

test('开始页开启定制模板，单选 Next.js 并进入构建区', async ({ page }, testInfo) => {
  await page.goto('/');
  const enabled = page.getByRole('switch', { name: 'Custom template' });
  await expect(enabled).toHaveAttribute('aria-checked', 'false', { timeout: 3000 });
  await expect(page.getByRole('dialog', { name: 'Custom template' })).toBeHidden();
  await enabled.click();
  const trigger = page.getByRole('button', { name: 'Starter template' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const analytics = page.getByRole('radio', { name: 'SaaS Analytics Dashboard' });
  const next = page.getByRole('radio', { name: 'Next.js' });
  await analytics.check();
  await next.check();
  await expect(next).toBeChecked();
  await expect(analytics).not.toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('next-template-selected.png') });
  await next.press('Escape');
  await expect(trigger).toBeFocused();
  await page.getByTestId('guide-user-input').fill('Sample AI App');
  await page.getByTestId('guide-submit-btn').click();
  await expect(page.getByText(/Base Starter Template: Next\.js/)).toBeVisible();
});
