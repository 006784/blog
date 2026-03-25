'use client';

const LANGUAGES = [
  { id: 'python',     label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'java',       label: 'Java' },
  { id: 'cpp',        label: 'C++' },
  { id: 'c',          label: 'C' },
  { id: 'php',        label: 'PHP' },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
  availableLanguages?: string[];
}

export function LanguageSelector({ value, onChange, availableLanguages }: LanguageSelectorProps) {
  const langs = availableLanguages?.length
    ? LANGUAGES.filter(l => availableLanguages.includes(l.id))
    : LANGUAGES;

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 text-sm rounded-lg bg-[#2d2d2d] text-gray-200 border border-[#3d3d3d] hover:border-[var(--gold)] focus:border-[var(--gold)] outline-none transition-colors cursor-pointer"
    >
      {langs.map(l => (
        <option key={l.id} value={l.id}>{l.label}</option>
      ))}
    </select>
  );
}

export { LANGUAGES };
