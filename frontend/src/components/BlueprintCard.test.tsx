import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlueprintCard, BlueprintDTO } from './BlueprintCard';

describe('BlueprintCard Component', () => {
  const mockBlueprint: BlueprintDTO = {
    chatId: 42,
    appName: 'SaaS Dashboard Pro',
    designDirection: 'Modern Bento-grid layout with vibrant accents',
    primaryColor: '#6366f1',
    themeId: 'dark',
    visuals: [
      {
        id: 'logo-1',
        type: 'logo',
        description: 'Geometric indigo logo mark',
        prompt: 'clean modern vector tech logo',
      },
    ],
    approved: false,
  };

  it('renders pending approval state and details correctly', () => {
    const onApprove = vi.fn();
    render(<BlueprintCard blueprint={mockBlueprint} onApprove={onApprove} />);

    expect(screen.getByText('SaaS Dashboard Pro')).toBeDefined();
    expect(screen.getByText('Pending Approval')).toBeDefined();
    expect(screen.getByText('Modern Bento-grid layout with vibrant accents')).toBeDefined();
    expect(screen.getByText('#6366f1')).toBeDefined();
    expect(screen.getByText('logo-1')).toBeDefined();
    expect(screen.getByText('Approve Blueprint & Start Generation')).toBeDefined();
  });

  it('calls onApprove callback when approve button clicked', () => {
    const onApprove = vi.fn();
    render(<BlueprintCard blueprint={mockBlueprint} onApprove={onApprove} />);

    const approveButton = screen.getByRole('button', { name: /Approve Blueprint/i });
    fireEvent.click(approveButton);

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledWith(42);
  });

  it('renders approved state without button when approved is true', () => {
    const onApprove = vi.fn();
    const approvedBlueprint: BlueprintDTO = {
      ...mockBlueprint,
      approved: true,
    };
    render(<BlueprintCard blueprint={approvedBlueprint} onApprove={onApprove} />);

    expect(screen.getByText('Approved')).toBeDefined();
    expect(screen.getByText(/Blueprint approved. Code implementation unlocked/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Approve Blueprint/i })).toBeNull();
  });
});
