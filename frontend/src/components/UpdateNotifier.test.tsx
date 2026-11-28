import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateNotifier, UpdatePayload } from './UpdateNotifier';
import { I18nProvider } from '../i18n/I18nContext';

describe('UpdateNotifier Component', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  const mockPayload: UpdatePayload = {
    available: true,
    version: '0.2.0',
    releaseUrl: 'https://github.com/blue-idea/BuildUI/releases/tag/v0.2.0',
    downloadUrl: 'https://github.com/blue-idea/BuildUI/releases/download/v0.2.0/BuildUI.dmg',
  };

  it('renders update notification banner when an update is available', () => {
    let triggerEvent: ((payload: UpdatePayload) => void) | undefined;
    const mockSubscribe = vi.fn((_eventName: string, handler: (payload: UpdatePayload) => void) => {
      triggerEvent = handler;
      return () => {};
    });

    render(
      <I18nProvider>
        <UpdateNotifier subscribe={mockSubscribe} />
      </I18nProvider>
    );

    expect(screen.queryByRole('status')).toBeNull();

    // 触发更新可用事件
    act(() => {
      triggerEvent!(mockPayload);
    });

    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText(/0\.2\.0/)).toBeDefined();
    expect(screen.getByText(/brew upgrade buildui/)).toBeDefined();
  });

  it('does not render when update payload is dismissed in localStorage', () => {
    window.localStorage.setItem('buildui.update.dismissedVersion', '0.2.0');

    let triggerEvent: ((payload: UpdatePayload) => void) | undefined;
    const mockSubscribe = vi.fn((_eventName: string, handler: (payload: UpdatePayload) => void) => {
      triggerEvent = handler;
      return () => {};
    });

    render(
      <I18nProvider>
        <UpdateNotifier subscribe={mockSubscribe} />
      </I18nProvider>
    );

    act(() => {
      triggerEvent!(mockPayload);
    });

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('dismisses banner and sets localStorage when Later is clicked', () => {
    let triggerEvent: ((payload: UpdatePayload) => void) | undefined;
    const mockSubscribe = vi.fn((_eventName: string, handler: (payload: UpdatePayload) => void) => {
      triggerEvent = handler;
      return () => {};
    });

    render(
      <I18nProvider>
        <UpdateNotifier subscribe={mockSubscribe} />
      </I18nProvider>
    );

    act(() => {
      triggerEvent!(mockPayload);
    });

    const laterButton = screen.getByTestId('btn-update-later');
    fireEvent.click(laterButton);

    expect(screen.queryByRole('status')).toBeNull();
    expect(window.localStorage.getItem('buildui.update.dismissedVersion')).toBe('0.2.0');
  });

  it('calls openUrl with download URL when Download is clicked', () => {
    const mockOpenUrl = vi.fn();
    let triggerEvent: ((payload: UpdatePayload) => void) | undefined;
    const mockSubscribe = vi.fn((_eventName: string, handler: (payload: UpdatePayload) => void) => {
      triggerEvent = handler;
      return () => {};
    });

    render(
      <I18nProvider>
        <UpdateNotifier subscribe={mockSubscribe} openUrl={mockOpenUrl} />
      </I18nProvider>
    );

    act(() => {
      triggerEvent!(mockPayload);
    });

    const downloadButton = screen.getByTestId('btn-update-download');
    fireEvent.click(downloadButton);

    expect(mockOpenUrl).toHaveBeenCalledWith(mockPayload.downloadUrl);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders adaptive light/dark frosted glass card with Apple System Blue primary CTA', () => {
    let triggerEvent: ((payload: UpdatePayload) => void) | undefined;
    const mockSubscribe = vi.fn((_eventName: string, handler: (payload: UpdatePayload) => void) => {
      triggerEvent = handler;
      return () => {};
    });

    render(
      <I18nProvider>
        <UpdateNotifier subscribe={mockSubscribe} />
      </I18nProvider>
    );

    act(() => {
      triggerEvent!(mockPayload);
    });

    const card = screen.getByRole('status');
    expect(card.className).toContain('bg-white/85');
    expect(card.className).toContain('dark:bg-zinc-900/85');
    expect(card.className).toContain('backdrop-blur-xl');
    expect(card.className).not.toContain('bg-slate-900/95');

    const downloadBtn = screen.getByTestId('btn-update-download');
    expect(downloadBtn.className).toContain('bg-blue-600');
  });
});
