import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PreviewPanel } from './PreviewPanel';

describe('PreviewPanel Component', () => {
  it('renders starting state indicator when starting', () => {
    render(
      <PreviewPanel
        previewUrl=""
        status="starting"
        onReload={vi.fn()}
        onStop={vi.fn()}
      />
    );

    expect(screen.getByText(/starting preview server/i)).toBeDefined();
  });

  it('renders iframe with correct previewUrl when running', () => {
    render(
      <PreviewPanel
        previewUrl="http://localhost:5173"
        status="running"
        onReload={vi.fn()}
        onStop={vi.fn()}
      />
    );

    const iframe = screen.getByTitle(/app live preview/i);
    expect(iframe).toBeDefined();
    expect(iframe.getAttribute('src')).toBe('http://localhost:5173');
  });

  it('triggers onReload and onStop callbacks on button click', () => {
    const handleReload = vi.fn();
    const handleStop = vi.fn();

    render(
      <PreviewPanel
        previewUrl="http://localhost:5173"
        status="running"
        onReload={handleReload}
        onStop={handleStop}
      />
    );

    const reloadBtn = screen.getByRole('button', { name: /reload preview/i });
    fireEvent.click(reloadBtn);
    expect(handleReload).toHaveBeenCalledTimes(1);

    const stopBtn = screen.getByRole('button', { name: /stop preview/i });
    fireEvent.click(stopBtn);
    expect(handleStop).toHaveBeenCalledTimes(1);
  });

  it('displays console error messages when forwarded', () => {
    render(
      <PreviewPanel
        previewUrl="http://localhost:5173"
        status="running"
        consoleErrors={['Uncaught TypeError: Cannot read properties of undefined']}
        onReload={vi.fn()}
        onStop={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Uncaught TypeError: Cannot read properties of undefined/i)
    ).toBeDefined();
  });
});
