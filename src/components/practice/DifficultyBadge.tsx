export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    easy:   { label: '简单', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    medium: { label: '中等', cls: 'text-amber-600 bg-amber-50 border-amber-200' },
    hard:   { label: '困难', cls: 'text-red-600 bg-red-50 border-red-200' },
  };
  const { label, cls } = map[difficulty] ?? { label: difficulty, cls: 'text-gray-500 bg-gray-50 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}
