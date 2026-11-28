import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// 使用独立源模拟子应用路由，直接加载实际的 Expo 预览桥接脚本。
const workoutPreview = `<!doctype html>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; background: #f2f4f1; color: #172721; font: 16px system-ui; }
  main { padding: 20px; } button { min-height: 48px; padding: 0 16px; }
  #session { min-height: 130vh; }
  #scroll-region { margin-top: 230px; height: 240px; overflow: auto; background: #fff; padding: 16px; }
  #scroll-content { height: 540px; padding-top: 108px; }
</style>
<main>
  <section id="today">
    <h1>Today's workout</h1>
    <p>Mobility · 20 min</p>
    <button id="log">Log workout</button>
    <p id="result" role="status"></p>
    <button id="review">View session</button>
  </section>
  <section id="session" hidden>
    <h1>Session details</h1>
    <p>Mobility session · 20 min</p>
    <div id="scroll-region">
      <div id="scroll-content">
        <button data-dyad-id="src/components/RecipeCard.tsx">Suggest Dinner</button>
      </div>
    </div>
  </section>
</main>
<script src="/preview-inspector.js"></script>
<script>
  function renderRoute() {
    const isSession = location.pathname.endsWith('/session');
    document.querySelector('#today').hidden = isSession;
    document.querySelector('#session').hidden = !isSession;
  }
  document.querySelector('#log').onclick = () => {
    document.querySelector('#result').textContent = 'Workout logged';
  };
  document.querySelector('#review').onclick = () => {
    history.pushState({}, '', '/fitness/session');
    renderRoute();
  };
  window.addEventListener('popstate', renderRoute);
  renderRoute();
</script>`;

async function openWorkoutPreview(page: Page, baseURL: string | undefined, route = '/fitness') {
  const preview = new URL(route, baseURL);
  preview.hostname = preview.hostname === '127.0.0.1' ? 'localhost' : '127.0.0.1';
  const bridge = await readFile(new URL('../../internal/scaffold/template/src/preview-inspector.js', import.meta.url), 'utf8');
  await page.route(`${preview.origin}/fitness**`, (route) => route.fulfill({ contentType: 'text/html', body: workoutPreview }));
  await page.route(`${preview.origin}/preview-inspector.js`, (route) => route.fulfill({ contentType: 'text/javascript', body: bridge }));
  await page.addInitScript((previewUrl) => {
    if (window !== window.top) return;
    const project = { appId: 1, name: 'Workout Check-in', path: '/workout', previewUrl, nativeApp: true, blueprintApproved: true };
    window.go = { main: { App: {
      GetSettings: async () => ({}),
      ListApps: async () => [{ id: project.appId, name: project.name, path: project.path }],
      GetActiveApp: async () => project,
      SwitchApp: async () => project,
      GetProjectChat: async () => ({ chatId: 1, blueprint: null, messages: [] }),
      GetVersions: async () => [],
      ListProjectFiles: async () => [],
    } } };
  }, preview.href);

  await page.goto('/');
  await page.getByTestId('dock-builder').click();
  const frameElement = page.getByTitle('App live preview');
  return { preview, frameElement, frame: frameElement.contentFrame() };
}

test('手机预览在两个尺寸下呈现主操作，并通过跨域工具栏遍历应用路由', async ({ page, baseURL }, testInfo) => {
  const { preview, frameElement, frame } = await openWorkoutPreview(page, baseURL);
  async function tap(control: Locator) {
    await expect(control).toBeVisible();
    const frameBox = await frameElement.boundingBox();
    if (!frameBox) throw new Error('The phone preview is not visible.');
    const target = await control.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x: (x + width / 2) / innerWidth, y: (y + height / 2) / innerHeight };
    });
    // 手机画布使用 CSS 缩放，按屏幕中的实际位置点击。
    await page.mouse.click(frameBox.x + frameBox.width * target.x, frameBox.y + frameBox.height * target.y);
  }
  const viewport = () => frame.locator('body').evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    contentWidth: document.documentElement.scrollWidth,
  }));
  const log = frame.getByRole('button', { name: 'Log workout' });
  const address = page.getByTestId('browser-address-input');
  const back = page.getByRole('button', { name: /^(back|后退)$/i });
  const forward = page.getByRole('button', { name: /^(forward|前进)$/i });
  await expect(log).toBeInViewport();
  await expect.poll(viewport).toEqual({ width: 390, height: 844, contentWidth: 390 });

  await page.getByRole('combobox', { name: /phone preview size|手机预览尺寸/i }).selectOption('compact');
  await expect.poll(viewport).toEqual({ width: 360, height: 800, contentWidth: 360 });
  await expect(log).toBeInViewport();
  await back.click();
  await expect(log).toBeVisible();
  await tap(log);
  await expect(frame.getByRole('status')).toHaveText('Workout logged');
  await page.screenshot({ path: testInfo.outputPath('workout-compact.png') });

  const session = frame.getByRole('heading', { name: 'Session details' });
  await tap(frame.getByRole('button', { name: 'View session' }));
  await expect(session).toBeVisible();
  await expect(address).toHaveValue(`${preview.href}/session`);
  await back.click();
  await expect(log).toBeVisible();
  await expect(frame.getByRole('status')).toHaveText('Workout logged');
  await expect(address).toHaveValue(preview.href);
  await forward.click();
  await expect(session).toBeVisible();
  await expect(address).toHaveValue(`${preview.href}/session`);
});

test('局部编辑选区在预览页面和内部容器滚动后仍贴合目标', async ({ page, baseURL }, testInfo) => {
  const { frame } = await openWorkoutPreview(page, baseURL, '/fitness/session');
  await page.getByRole('button', { name: /toggle component inspector/i }).click();
  const target = frame.getByRole('button', { name: 'Suggest Dinner' });
  const scroller = frame.locator('#scroll-region');
  await expect(target).toBeInViewport();
  await target.evaluate((button: HTMLButtonElement) => button.click());
  const popover = page.getByTestId('local-edit-popover');
  await expect(popover).toBeVisible();

  const getVerticalGap = () => target.evaluate((button) => {
    const highlight = document.getElementById('__buildui_inspector_overlay__')!;
    return Math.abs(button.getBoundingClientRect().top - highlight.getBoundingClientRect().top);
  });
  await expect.poll(getVerticalGap).toBeLessThan(1);

  await scroller.evaluate((element) => element.scrollTo(0, 48));
  await target.evaluate(() => window.scrollTo(0, 72));
  await expect.poll(() => scroller.evaluate((element) => [element.scrollTop, window.scrollY])).toEqual([48, 72]);
  await expect.poll(getVerticalGap).toBeLessThan(1);
  await expect(popover).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('local-edit-after-scroll.png'), animations: 'disabled' });

  await page.keyboard.press('Escape');
  await expect(frame.locator('#__buildui_inspector_overlay__')).toBeHidden();
});
