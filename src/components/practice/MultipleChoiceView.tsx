'use client';

interface Choice {
  id: string;
  text: string;
}

interface MultipleChoiceViewProps {
  choices: Choice[];
  selected: string | null;
  onSelect: (id: string) => void;
  result?: { status: string; correct?: string } | null;
}

export function MultipleChoiceView({ choices, selected, onSelect, result }: MultipleChoiceViewProps) {
  const isSubmitted = !!result;

  function getChoiceStyle(id: string) {
    if (!isSubmitted) {
      return selected === id
        ? 'border-(--gold,#c4a96d) bg-amber-50 text-(--ink)'
        : 'border-(--line,#ddd9d0) hover:border-(--gold) cursor-pointer';
    }
    // After submission
    if (result?.correct === id) return 'border-emerald-500 bg-emerald-50 text-emerald-800';
    if (selected === id && result?.status !== 'accepted') return 'border-red-400 bg-red-50 text-red-700';
    return 'border-(--line) opacity-60';
  }

  return (
    <div className="space-y-3 p-4">
      <p className="text-sm text-(--ink-muted) mb-4">请选择正确答案：</p>
      {choices.map((choice) => (
        <button
          key={choice.id}
          disabled={isSubmitted}
          onClick={() => !isSubmitted && onSelect(choice.id)}
          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${getChoiceStyle(choice.id)}`}
        >
          <div className="flex items-start gap-3">
            <span className="font-bold text-(--gold) min-w-[1.5rem]">{choice.id.toUpperCase()}.</span>
            <pre className="font-mono whitespace-pre-wrap break-all">{choice.text}</pre>
          </div>
        </button>
      ))}
    </div>
  );
}
