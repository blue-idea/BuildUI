import { describe, it, expect } from 'vitest';
import {
  extractStyleFromReference,
  buildDesignSystemPrompt,
  getBenchmarkThemePresets,
} from './styleExtractor';

describe('styleExtractor Utility (TDD)', () => {
  it('extracts high-fidelity design system for real benchmark website Linear (name & URL)', () => {
    // 支持按名称提取
    const linearByName = extractStyleFromReference('Linear');
    expect(linearByName.name).toContain('Linear');
    expect(linearByName.palette.primary.toLowerCase()).toBe('#5e6ad2');
    expect(linearByName.palette.background).toBe('#08090a');
    expect(linearByName.palette.surface).toBe('#121316');
    expect(linearByName.typography).toContain('Inter');
    expect(linearByName.tags).toContain('Dark Mode');
    expect(linearByName.stylePrompt).toContain('# Design System Specification: Linear');
    expect(linearByName.stylePrompt).toContain('Primary Brand Accent: #5e6ad2');
    expect(linearByName.stylePrompt).toContain('[Tailwind Implementation Directives]');
    // 兼容 designPrompt 旧字段
    expect(linearByName.designPrompt).toBe(linearByName.stylePrompt);

    // 支持按真实 URL 提取 (https://linear.app)
    const linearByUrl = extractStyleFromReference('https://linear.app');
    expect(linearByUrl.palette.primary.toLowerCase()).toBe('#5e6ad2');
    expect(linearByUrl.referenceSource).toBe('https://linear.app');
  });

  it('extracts high-fidelity design system for real benchmark websites Stripe, Supabase, and Vercel', () => {
    // Stripe
    const stripe = extractStyleFromReference('https://stripe.com');
    expect(stripe.palette.primary.toLowerCase()).toBe('#635bff');
    expect(stripe.palette.text).toBe('#0a2540');
    expect(stripe.stylePrompt).toContain('Primary Brand Accent: #635bff');
    expect(stripe.tags).toContain('Modern SaaS');

    // Supabase
    const supabase = extractStyleFromReference('supabase');
    expect(supabase.palette.primary.toLowerCase()).toBe('#3ecf8e');
    expect(supabase.tags).toContain('Developer Dark');
    expect(supabase.stylePrompt).toContain('Primary Brand Accent: #3ecf8e');

    // Vercel
    const vercel = extractStyleFromReference('vercel');
    expect(vercel.palette.primary).toBe('#000000');
    expect(vercel.stylePrompt).toContain('Geek Monochrome');
  });

  it('intelligently infers balanced palette and prompt for arbitrary custom URL or natural language', () => {
    // 自定义自然语言描述
    const customFintech = extractStyleFromReference('Modern Neon Cyberpunk Finance');
    expect(customFintech.palette.primary).toBeDefined();
    expect(customFintech.palette.background).toBeDefined();
    expect(customFintech.palette.surface).toBeDefined();
    expect(customFintech.stylePrompt).toContain('# Design System Specification:');
    expect(customFintech.stylePrompt).toContain('[Layout & Component Directives]');

    // 自定义未知 URL
    const customUrl = extractStyleFromReference('https://my-cool-app.dev');
    expect(customUrl.name).toBe('My Cool App Inspired');
    expect(customUrl.stylePrompt).toContain('My Cool App');
  });

  it('buildDesignSystemPrompt generates structured industrial-grade specification', () => {
    const prompt = buildDesignSystemPrompt(
      'Acme UI',
      {
        primary: '#3b82f6',
        accent: '#60a5fa',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#e2e8f0',
      },
      'xl',
      'Inter, system-ui',
      ['Clean', 'SaaS']
    );

    expect(prompt).toContain('# Design System Specification: Acme UI');
    expect(prompt).toContain('- Primary Brand Accent: #3b82f6');
    expect(prompt).toContain('- Secondary Accent: #60a5fa');
    expect(prompt).toContain('rounded-xl');
    expect(prompt).toContain('[Tailwind Implementation Directives]');
  });

  it('customizes design prompt and tags according to appType (web, app, desktop)', () => {
    // App
    const mobileStyle = extractStyleFromReference('Notion', false, 'app');
    expect(mobileStyle.appType).toBe('app');
    expect(mobileStyle.tags).toContain('Mobile App');
    expect(mobileStyle.stylePrompt).toContain('[Platform Architecture Directives: Mobile App]');
    expect(mobileStyle.stylePrompt).toContain('44×44 pt on iOS and 48×48 dp on Android');
    expect(mobileStyle.stylePrompt).toContain('3–5 stable top-level destinations');

    // Desktop
    const desktopStyle = extractStyleFromReference('Linear', false, 'desktop');
    expect(desktopStyle.appType).toBe('desktop');
    expect(desktopStyle.tags).toContain('Desktop Native');
    expect(desktopStyle.stylePrompt).toContain('[Platform Architecture Directives: Desktop Workstation]');
    expect(desktopStyle.stylePrompt).toContain('3-column split workstation');

    // Web default
    const webStyle = extractStyleFromReference('Stripe');
    expect(webStyle.appType).toBe('web');
    expect(webStyle.tags).toContain('Web SaaS');
    expect(webStyle.stylePrompt).toContain('[Platform Architecture Directives: Web]');
  });

  it('includes classic App and Desktop benchmark presets in getBenchmarkThemePresets() without dark backgrounds for App', () => {
    const presets = getBenchmarkThemePresets();

    // 验证所有 App 预设中已彻底移除纯黑/深黑背景风格
    const iosHealth = presets.find((p) => p.id === 'benchmark-ios-health');
    expect(iosHealth).toBeUndefined();
    const threads = presets.find((p) => p.id === 'benchmark-threads');
    expect(threads).toBeUndefined();
    const cashapp = presets.find((p) => p.id === 'benchmark-cashapp');
    expect(cashapp).toBeUndefined();

    // 包含补充的经典高品质浅色移动端 App 设计风格
    const iosClean = presets.find((p) => p.id === 'benchmark-ios-clean');
    expect(iosClean).toBeDefined();
    expect(iosClean?.appType).toBe('app');
    expect(iosClean?.tags).toContain('Mobile App');
    expect(iosClean?.stylePrompt).toContain('[Platform Architecture Directives: Mobile App]');

    const airbnb = presets.find((p) => p.id === 'benchmark-airbnb-mobile');
    expect(airbnb).toBeDefined();
    expect(airbnb?.appType).toBe('app');

    const headspace = presets.find((p) => p.id === 'benchmark-headspace-mobile');
    expect(headspace).toBeDefined();
    expect(headspace?.appType).toBe('app');

    const revolut = presets.find((p) => p.id === 'benchmark-revolut-mobile');
    expect(revolut).toBeDefined();
    expect(revolut?.appType).toBe('app');

    const notion = presets.find((p) => p.id === 'benchmark-notion-mobile');
    expect(notion).toBeDefined();
    expect(notion?.appType).toBe('app');

    const duolingo = presets.find((p) => p.id === 'benchmark-duolingo');
    expect(duolingo).toBeDefined();
    expect(duolingo?.appType).toBe('app');

    // 关键守恒定律：所有移动端 App 风格模版的背景绝对不能是深黑/纯黑底色
    const appPresets = presets.filter((p) => p.appType === 'app');
    expect(appPresets.length).toBeGreaterThanOrEqual(6);
    appPresets.forEach((p) => {
      expect(['#000000', '#101010', '#111111', '#121212']).not.toContain(p.background.toLowerCase());
    });

    // 包含经典 Desktop 客户端设计风格
    const windowsFluent = presets.find((p) => p.id === 'benchmark-windows-fluent');
    expect(windowsFluent).toBeDefined();
    expect(windowsFluent?.appType).toBe('desktop');
    expect(windowsFluent?.tags).toContain('Desktop Native');
    expect(windowsFluent?.stylePrompt).toContain('[Platform Architecture Directives: Desktop Workstation]');

    const slack = presets.find((p) => p.id === 'benchmark-slack');
    expect(slack).toBeDefined();
    expect(slack?.appType).toBe('desktop');

    const vscode = presets.find((p) => p.id === 'benchmark-vscode');
    expect(vscode).toBeDefined();
    expect(vscode?.appType).toBe('desktop');

    const apple = presets.find((p) => p.id === 'benchmark-apple');
    expect(apple?.appType).toBe('desktop');
    const raycast = presets.find((p) => p.id === 'benchmark-raycast');
    expect(raycast?.appType).toBe('desktop');
  });

  it('matches benchmark preset when extracting classic app or desktop styles by name or alias', () => {
    const extractedClean = extractStyleFromReference('iOS Clean', false, 'app');
    expect(extractedClean.name).toContain('iOS Modern Clean');
    expect(extractedClean.appType).toBe('app');
    expect(extractedClean.stylePrompt).toContain('[Platform Architecture Directives: Mobile App]');

    const extractedAirbnb = extractStyleFromReference('Airbnb App', false, 'app');
    expect(extractedAirbnb.name).toContain('Airbnb Mobile');
    expect(extractedAirbnb.appType).toBe('app');

    const extractedFluent = extractStyleFromReference('Windows Fluent', false, 'desktop');
    expect(extractedFluent.name).toContain('Windows Fluent');
    expect(extractedFluent.appType).toBe('desktop');
    expect(extractedFluent.stylePrompt).toContain('[Platform Architecture Directives: Desktop Workstation]');
  });
});
