import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionnaireCard, QuestionItem } from './QuestionnaireCard';
import { I18nProvider } from '../i18n/I18nContext';

describe('QuestionnaireCard Component', () => {
  const mockQuestions: QuestionItem[] = [
    {
      id: 'q1',
      category: 'features',
      question: 'What is the primary target audience?',
      type: 'single_choice',
      options: ['Developers', 'Designers', 'End Users'],
      allowCustom: true,
    },
    {
      id: 'q2',
      category: 'palette',
      question: 'Provide any custom branding guidelines',
      type: 'text',
    },
  ];

  it('renders questions and allows options selection and submit', () => {
    const onSubmit = vi.fn();
    render(<QuestionnaireCard questions={mockQuestions} onSubmit={onSubmit} />);

    expect(screen.getByText(/Project Clarification Questionnaire/i)).toBeDefined();
    expect(screen.getByText(/1. What is the primary target audience?/i)).toBeDefined();
    expect(screen.getByText('Developers')).toBeDefined();

    // 选择选项
    fireEvent.click(screen.getByText('Developers'));

    // 输入文本
    const textInput = screen.getByPlaceholderText('Type your answer...');
    fireEvent.change(textInput, { target: { value: 'Minimalist neon theme' } });

    // 补充自定义说明
    const customInput = screen.getByPlaceholderText(/Add custom details/i);
    fireEvent.change(customInput, { target: { value: 'Prefer compact density' } });

    // 提交
    fireEvent.click(screen.getByTestId('questionnaire-submit-btn'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      q1: 'Developers',
      q1__custom: 'Prefer compact density',
      q2: 'Minimalist neon theme',
    });
  });

  it('renders localized Chinese copy and supports skip callback', () => {
    const onSkip = vi.fn();
    render(
      <I18nProvider initialLocale="zh">
        <QuestionnaireCard
          summary="请确认核心功能与视觉色调："
          questions={[
            {
              id: 'q1',
              category: 'ui',
              question: '偏好哪种页面布局？',
              type: 'multi_choice',
              options: ['顶部导航', '侧栏工作台'],
            },
          ]}
          onSubmit={vi.fn()}
          onSkip={onSkip}
        />
      </I18nProvider>
    );

    expect(screen.getByText('需求与设计澄清')).toBeDefined();
    expect(screen.getByText('请确认核心功能与视觉色调：')).toBeDefined();
    expect(screen.getByText('UI 与布局')).toBeDefined();

    fireEvent.click(screen.getByTestId('questionnaire-skip-btn'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('uses restrained Apple System Blue highlights without indigo or purple classes', () => {
    const { container } = render(
      <QuestionnaireCard
        questions={[
          {
            id: 'q1',
            category: 'ui',
            question: 'Select layout style',
            type: 'single_choice',
            options: ['Sidebar', 'Topbar'],
            allowCustom: true,
          },
        ]}
        onSubmit={vi.fn()}
      />
    );

    const card = screen.getByTestId('questionnaire-card');
    expect(card.className).toContain('border-blue-200');

    const submitBtn = screen.getByTestId('questionnaire-submit-btn');
    expect(submitBtn.className).toContain('bg-blue-600');

    fireEvent.click(screen.getByText('Sidebar'));
    expect(container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
  });
});
