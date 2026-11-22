import { describe, it, expect } from 'vitest';
import { generateSafeAppName } from './appName';

describe('generateSafeAppName utility', () => {
  it('generates fallback app name when input is empty or undefined', () => {
    const name1 = generateSafeAppName();
    expect(name1).toMatch(/^App-\d+$/);

    const name2 = generateSafeAppName('', [], 'Project');
    expect(name2).toMatch(/^Project-\d+$/);
  });

  it('generates clean app name by stripping special and illegal path characters', () => {
    const input = 'Create a crypto dashboard / v2: *best*?';
    const name = generateSafeAppName(input);
    expect(name).not.toMatch(/[\\/:*?"<>|]/);
    expect(name).toContain('Create a crypto dashboard');
  });

  it('handles multi-line input by taking the first line', () => {
    const input = 'Personal Finance App\n• Modern UI\n• Dark theme';
    const name = generateSafeAppName(input);
    expect(name).toBe('Personal Finance App');
  });

  it('handles Chinese and Unicode characters correctly', () => {
    const input = '智能记账应用助手 - 极简记账';
    const name = generateSafeAppName(input);
    expect(name).toBe('智能记账应用助手 - 极简记账');
  });

  it('appends timestamp suffix if name collides with existing app names', () => {
    const existing = ['My App', 'Pantry Planner'];
    const name = generateSafeAppName('My App', existing);
    expect(name).toMatch(/^My App-\d+$/);
  });
});
