import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { macosTokens, applyThemeToElement } from './macos';
import { ThemeProvider, useMacOSTheme } from '../context/ThemeContext';
import { ThemeModeToggle } from '../components/ThemeModeToggle';

describe('TASK-025: macOS Theme Tokens and Context Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('should export valid macOS light and dark design tokens', () => {
    expect(macosTokens.light.userBubbleBg).toBe('#e8e5ff');
    expect(macosTokens.light.userBubbleText).toBe('#2c246b');
    expect(macosTokens.dark.canvasBg).toBe('#121214');
    expect(macosTokens.dark.userBubbleBg).toBe('#312e81');
  });

  it('should apply CSS variables to root element', () => {
    const el = document.createElement('div');
    applyThemeToElement(el, 'light');
    expect(el.style.getPropertyValue('--macos-user-bubble-bg')).toBe('#e8e5ff');

    applyThemeToElement(el, 'dark');
    expect(el.style.getPropertyValue('--macos-user-bubble-bg')).toBe('#312e81');
  });

  const TestConsumer = () => {
    const { themeMode, toggleTheme, isDark, tokens } = useMacOSTheme();
    return (
      <div>
        <span data-testid="theme-mode">{themeMode}</span>
        <span data-testid="is-dark">{String(isDark)}</span>
        <span data-testid="canvas-bg">{tokens.canvasBg}</span>
        <button onClick={toggleTheme}>Toggle</button>
      </div>
    );
  };

  it('should initialize with light theme by default and toggle to dark', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(screen.getByTestId('is-dark').textContent).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click toggle button
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('blot_theme_mode')).toBe('dark');

    // Toggle back to light
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('blot_theme_mode')).toBe('light');
  });

  it('should initialize with persisted theme mode from localStorage', () => {
    localStorage.setItem('blot_theme_mode', 'dark');

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ThemeModeToggle component renders and toggles theme', () => {
    render(
      <ThemeProvider>
        <ThemeModeToggle />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /switch to dark/i });
    expect(toggleBtn).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
