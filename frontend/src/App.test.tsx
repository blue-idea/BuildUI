import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App Main Split Layout & Workflow', () => {
  it('renders dual-pane split layout with chat and preview panels', () => {
    render(<App />);

    // 验证全局应用头部
    expect(screen.getByText('Blot-UI')).toBeDefined();

    // 验证左侧 Chat 交互区元素
    expect(screen.getByText(/Chat & Blueprint/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/describe what to build/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /send prompt/i })).toBeDefined();

    // 验证右侧 Preview 区域元素
    expect(screen.getByText('Preview')).toBeDefined();
  });

  it('submits a user prompt and appends to chat stream', () => {
    render(<App />);

    const input = screen.getByPlaceholderText(/describe what to build/i);
    const sendBtn = screen.getByRole('button', { name: /send prompt/i });

    fireEvent.change(input, { target: { value: 'Create a modern portfolio app' } });
    fireEvent.click(sendBtn);

    expect(screen.getByText('Create a modern portfolio app')).toBeDefined();
  });

  it('handles blueprint approval and transitions implementation state', () => {
    render(<App />);

    // 触发进入需要审批蓝图的模拟状态
    const mockBlueprintBtn = screen.getByRole('button', { name: /mock blueprint/i });
    fireEvent.click(mockBlueprintBtn);

    expect(screen.getByText('Pending Approval')).toBeDefined();

    // 点击审批按钮
    const approveBtn = screen.getByRole('button', { name: /approve blueprint/i });
    fireEvent.click(approveBtn);

    // 验证审批通过
    expect(screen.getByText('Approved')).toBeDefined();
  });

  it('opens and closes settings modal from top navigation', () => {
    render(<App />);

    const settingsBtn = screen.getByRole('button', { name: /open settings/i });
    fireEvent.click(settingsBtn);

    expect(screen.getByText('LLM Provider Settings')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close settings/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('LLM Provider Settings')).toBeNull();
  });
});
