import React, { useState } from 'react';

export interface QuestionItem {
  id: string;
  question: string;
  type: 'single_choice' | 'multi_choice' | 'text';
  options?: string[];
}

export interface QuestionnaireProps {
  questions: QuestionItem[];
  onSubmit: (answers: Record<string, string | string[]>) => void;
  disabled?: boolean;
}

export const QuestionnaireCard: React.FC<QuestionnaireProps> = ({
  questions,
  onSubmit,
  disabled = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const handleOptionSelect = (qId: string, option: string, isMulti: boolean) => {
    if (disabled) return;
    if (isMulti) {
      const current = (answers[qId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      setAnswers((prev) => ({ ...prev, [qId]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: option }));
    }
  };

  const handleTextChange = (qId: string, value: string) => {
    if (disabled) return;
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit(answers);
  };

  return (
    <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg text-slate-100">
      <div className="mb-4 border-b border-slate-800 pb-3">
        <h3 className="text-base font-semibold text-blue-400">Project Clarification Questionnaire</h3>
        <p className="text-xs text-slate-400">Please answer a few quick questions to help refine the design.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              {idx + 1}. {q.question}
            </label>

            {q.type === 'text' ? (
              <input
                type="text"
                disabled={disabled}
                value={(answers[q.id] as string) || ''}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                placeholder="Type your answer..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {q.options?.map((opt) => {
                  const isSelected =
                    q.type === 'multi_choice'
                      ? ((answers[q.id] as string[]) || []).includes(opt)
                      : answers[q.id] === opt;

                  return (
                    <button
                      type="button"
                      key={opt}
                      disabled={disabled}
                      onClick={() => handleOptionSelect(q.id, opt, q.type === 'multi_choice')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            Submit Answers
          </button>
        </div>
      </form>
    </div>
  );
};
