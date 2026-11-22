import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionTimelineModal, VersionItem, VersionDiffResult } from './VersionTimelineModal';

const mockVersions: VersionItem[] = [
  {
    id: 2,
    commitHash: 'b2c3d4e',
    message: 'Turn update from Agent: added charts',
    createdAt: new Date().toISOString(),
  },
  {
    id: 1,
    commitHash: 'a1b2c3d',
    message: 'Initial project setup',
    createdAt: new Date().toISOString(),
  },
];

const mockDiff: VersionDiffResult = {
  commitHash: 'b2c3d4e',
  message: 'Turn update from Agent: added charts',
  files: [
    {
      path: 'src/App.tsx',
      status: 'modified',
      additions: 12,
      deletions: 2,
      hunks: ['@@ -10,2 +10,12 @@\n- old line\n+ new line with charts'],
    },
  ],
};

describe('VersionTimelineModal', () => {
  it('renders timeline with versions and displays diff on selection', async () => {
    const handleSelect = vi.fn().mockResolvedValue(mockDiff);
    const handleRollback = vi.fn();

    render(
      <VersionTimelineModal
        isOpen={true}
        onClose={vi.fn()}
        versions={mockVersions}
        onSelectVersion={handleSelect}
        onRollback={handleRollback}
      />
    );

    expect(screen.getByText('Version Time Machine')).toBeDefined();
    expect(screen.getByText('added charts', { exact: false })).toBeDefined();
    expect(screen.getByText('Initial project setup', { exact: false })).toBeDefined();

    // 点击第一个版本，查看 Diff
    const versionCard = screen.getByText('added charts', { exact: false });
    fireEvent.click(versionCard);

    await waitFor(() => {
      expect(handleSelect).toHaveBeenCalledWith('b2c3d4e');
      expect(screen.getByText('src/App.tsx')).toBeDefined();
      expect(screen.getByText('+12')).toBeDefined();
      expect(screen.getByText('-2')).toBeDefined();
    });
  });

  it('triggers rollback when user confirms rollback button', async () => {
    const handleRollback = vi.fn().mockResolvedValue(undefined);

    render(
      <VersionTimelineModal
        isOpen={true}
        onClose={vi.fn()}
        versions={mockVersions}
        onSelectVersion={vi.fn().mockResolvedValue(mockDiff)}
        onRollback={handleRollback}
      />
    );

    // 选中版本以显示回滚按钮
    const versionCard = screen.getByText('added charts', { exact: false });
    fireEvent.click(versionCard);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Rollback to this version' })).toBeDefined();
    });

    const rollbackBtn = screen.getByRole('button', { name: 'Rollback to this version' });
    fireEvent.click(rollbackBtn);

    await waitFor(() => {
      expect(handleRollback).toHaveBeenCalledWith('b2c3d4e');
    });
  });

  it('项目正在验证时禁用回滚', async () => {
    const rollback = vi.fn();
    render(
      <VersionTimelineModal
        isOpen
        onClose={vi.fn()}
        versions={mockVersions}
        onSelectVersion={vi.fn().mockResolvedValue(mockDiff)}
        onRollback={rollback}
        rollbackDisabled
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select version b2c3d4e' }));
    await screen.findByText('src/App.tsx');
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Rollback to this version' });
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(rollback).not.toHaveBeenCalled();
  });

  it('adapts modal container and diff viewer with light/dark theme classes', async () => {
    const handleSelect = vi.fn().mockResolvedValue(mockDiff);
    render(
      <VersionTimelineModal
        isOpen
        onClose={vi.fn()}
        versions={mockVersions}
        onSelectVersion={handleSelect}
        onRollback={vi.fn()}
      />
    );

    const dialogPanel = document.querySelector('.max-w-4xl');
    expect(dialogPanel).not.toBeNull();
    // 验证支持明暗双模响应式类，而非硬编码全黑
    expect(dialogPanel?.className).toContain('bg-white');
    expect(dialogPanel?.className).toContain('dark:bg-zinc-900');
    expect(dialogPanel?.className).toContain('border-slate-200');
    expect(dialogPanel?.className).toContain('dark:border-zinc-800');

    // 选中版本展示 Diff
    fireEvent.click(screen.getByRole('button', { name: 'Select version b2c3d4e' }));
    await screen.findByText('src/App.tsx');

    // 验证 DiffViewer 文件容器同样具备明暗双模类
    const fileContainer = screen.getByText('src/App.tsx').closest('.rounded-xl, .rounded-lg');
    expect(fileContainer).not.toBeNull();
    expect(fileContainer?.className).toContain('border-slate-200');
    expect(fileContainer?.className).toContain('dark:border-zinc-800');
  });
});
