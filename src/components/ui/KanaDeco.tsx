interface KanaDecoProps {
  char?: string;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  top?: string;
  className?: string;
}

const sizeMap = {
  sm: '0.65rem',
  md: '0.8rem',
  lg: '1rem',
};

export function KanaDeco({
  char = 'の',
  position = 'left',
  size = 'md',
  top = '2rem',
  className = '',
}: KanaDecoProps) {
  return (
    <span
      aria-hidden="true"
      className={`kana-deco kana-deco-${size} ${className}`}
      style={{
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        fontFamily: 'var(--font-mincho)',
        fontSize: sizeMap[size],
        color: 'var(--kana-ghost)',
        letterSpacing: '0.25em',
        position: 'absolute',
        top,
        [position]: '-1.5rem',
        userSelect: 'none',
        pointerEvents: 'none',
        lineHeight: 1,
      }}
    >
      {char}
    </span>
  );
}
