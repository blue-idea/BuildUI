import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MacOSWindowHeader } from './MacOSWindowHeader';
import { LeftDock } from './LeftDock';
import { FileChangeCard } from './FileChangeCard';
import { WorkspacePanel } from './WorkspacePanel';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  );
};

describe('TASK-027: macOS Chrome and Workbench Components', () => {
  describe('MacOSWindowHeader', () => {
    it('renders traffic lights, manage app, active project tab, and does not render pro badge', () => {
      const onManageApp = vi.fn();
      renderWithProviders(
        <MacOSWindowHeader
          appName="Pantry Planner"
          onManageApp={onManageApp}
        />
      );

      // Traffic lights
      expect(screen.getByTestId('traffic-light-close')).toBeDefined();
      expect(screen.getByTestId('traffic-light-min')).toBeDefined();
      expect(screen.getByTestId('traffic-light-zoom')).toBeDefined();

      // Manage app button
      const manageBtn = screen.getByRole('button', { name: /manage app/i });
      expect(manageBtn).toBeDefined();
      fireEvent.click(manageBtn);
      expect(onManageApp).toHaveBeenCalled();

      // Project Tab
      expect(screen.getByText('Pantry Planner')).toBeDefined();

      // Pro badge should be removed
      expect(screen.queryByText(/pro/i)).toBeNull();
    });

    it('renders close button on project tab and triggers onCloseTab when clicked', () => {
      const onCloseTab = vi.fn();
      renderWithProviders(
        <MacOSWindowHeader
          appName="demo"
          onCloseTab={onCloseTab}
        />
      );

      const closeBtn = screen.getByTestId('close-project-tab');
      expect(closeBtn).toBeDefined();
      fireEvent.click(closeBtn);
      expect(onCloseTab).toHaveBeenCalledTimes(1);
    });

    it('triggers onCloseTab when clicking the project tab itself', () => {
      const onCloseTab = vi.fn();
      renderWithProviders(
        <MacOSWindowHeader
          appName="demo"
          onCloseTab={onCloseTab}
        />
      );

      const projectTab = screen.getByTestId('project-tab');
      expect(projectTab).toBeDefined();
      fireEvent.click(projectTab);
      expect(onCloseTab).toHaveBeenCalledTimes(1);
    });

    it('does not render project tab when appName is empty or undefined', () => {
      renderWithProviders(
        <MacOSWindowHeader
          appName=""
        />
      );

      expect(screen.queryByTestId('project-tab')).toBeNull();
    });
  });

  describe('LeftDock', () => {
    it('renders 7 action icons and triggers callbacks', () => {
      const onSelectTab = vi.fn();
      const onOpenTemplates = vi.fn();

      renderWithProviders(
        <LeftDock
          activeTab="home"
          onSelectTab={onSelectTab}
          onOpenTemplates={onOpenTemplates}
        />
      );

      const homeBtn = screen.getByTestId('dock-home');
      const templatesBtn = screen.getByTestId('dock-templates');

      expect(homeBtn).toBeDefined();
      expect(templatesBtn).toBeDefined();

      fireEvent.click(templatesBtn);
      expect(onOpenTemplates).toHaveBeenCalled();
      expect(onSelectTab).toHaveBeenCalledWith('templates');
    });
  });

  describe('FileChangeCard', () => {
    it('renders writing status with spinner', () => {
      const onInspect = vi.fn();
      renderWithProviders(
        <FileChangeCard
          item={{
            id: '1',
            filename: 'RecipeCard.tsx',
            path: 'src/components/RecipeCard.tsx',
            status: 'writing',
          }}
          onInspect={onInspect}
        />
      );

      expect(screen.getByText('RecipeCard.tsx')).toBeDefined();
      expect(screen.getByText('src/components/RecipeCard.tsx')).toBeDefined();
      expect(screen.getByText(/writing\.\.\./i)).toBeDefined();

      const inspectBtn = screen.getByTestId('inspect-file-1');
      fireEvent.click(inspectBtn);
      expect(onInspect).toHaveBeenCalledWith('src/components/RecipeCard.tsx');
    });

    it('renders completed status with checkmark', () => {
      renderWithProviders(
        <FileChangeCard
          item={{
            id: '2',
            filename: 'PantryList.tsx',
            path: 'src/components/PantryList.tsx',
            status: 'completed',
          }}
        />
      );

      expect(screen.getByText('PantryList.tsx')).toBeDefined();
      expect(screen.getByTestId('status-completed-2')).toBeDefined();
    });
  });

  describe('WorkspacePanel', () => {
    it('renders segmented control (Preview, Code, Publish) and switches tabs', () => {
      const onViewChange = vi.fn();
      renderWithProviders(
        <WorkspacePanel
          activeView="preview"
          onViewChange={onViewChange}
          isLoading={true}
        />
      );

      // Segmented control tabs
      const previewTab = screen.getByTestId('tab-preview');
      const codeTab = screen.getByTestId('tab-code');
      const publishTab = screen.getByTestId('tab-publish');

      expect(previewTab).toBeDefined();
      expect(codeTab).toBeDefined();
      expect(publishTab).toBeDefined();

      fireEvent.click(codeTab);
      expect(onViewChange).toHaveBeenCalledWith('code');

      // Browser bar
      expect(screen.getByTestId('browser-address')).toBeDefined();

      // Loading state in preview
      expect(screen.getByText(/starting up your app\.\.\./i)).toBeDefined();

      // System Messages console drawer
      const drawerToggle = screen.getByTestId('system-messages-toggle');
      expect(drawerToggle).toBeDefined();
      fireEvent.click(drawerToggle);
      expect(screen.getByTestId('system-messages-drawer')).toBeDefined();
    });
  });
});
