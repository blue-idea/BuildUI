import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportModal } from './ExportModal';

describe('ExportModal Component', () => {
  it('renders modal with project info and export button', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        appName="SaaS Dashboard"
        onExportZip={vi.fn()}
        onRevealInFileManager={vi.fn()}
      />
    );

    expect(screen.getByText('Export Project')).toBeDefined();
    expect(screen.getByText('SaaS Dashboard')).toBeDefined();
    expect(screen.getByRole('button', { name: /export as zip/i })).toBeDefined();
  });

  it('triggers onExportZip and displays success feedback', async () => {
    const handleExport = vi.fn().mockResolvedValue('/downloads/saas-dashboard.zip');
    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        appName="SaaS Dashboard"
        onExportZip={handleExport}
        onRevealInFileManager={vi.fn()}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /export as zip/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(handleExport).toHaveBeenCalled();
      expect(screen.getByText(/exported successfully to:/i)).toBeDefined();
      expect(screen.getByText('/downloads/saas-dashboard.zip')).toBeDefined();
    });
  });

  it('triggers onRevealInFileManager when clicking reveal button', async () => {
    const handleReveal = vi.fn().mockResolvedValue(undefined);
    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        appName="SaaS Dashboard"
        onExportZip={vi.fn().mockResolvedValue('/downloads/app.zip')}
        onRevealInFileManager={handleReveal}
      />
    );

    // 先点击导出生成路径
    const exportBtn = screen.getByRole('button', { name: /export as zip/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reveal in explorer/i })).toBeDefined();
    });

    const revealBtn = screen.getByRole('button', { name: /reveal in explorer/i });
    fireEvent.click(revealBtn);

    expect(handleReveal).toHaveBeenCalledWith('/downloads/app.zip');
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <ExportModal
        isOpen={true}
        onClose={handleClose}
        appName="SaaS Dashboard"
        onExportZip={vi.fn()}
        onRevealInFileManager={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close export modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
