import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionnaireCard, QuestionItem } from './QuestionnaireCard';

describe('QuestionnaireCard Component', () => {
  const mockQuestions: QuestionItem[] = [
    {
      id: 'q1',
      question: 'What is the primary target audience?',
      type: 'single_choice',
      options: ['Developers', 'Designers', 'End Users'],
    },
    {
      id: 'q2',
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

    // 提交
    fireEvent.click(screen.getByRole('button', { name: /Submit Answers/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      q1: 'Developers',
      q2: 'Minimalist neon theme',
    });
  });
});
