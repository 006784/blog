export type DiaryTheme = 'kraft' | 'washi' | 'literary' | 'minimal';

export const DIARY_THEMES: Record<
  DiaryTheme,
  {
    name: string;
    desc: string;
    isDark?: boolean;
    vars: Record<string, string>;
  }
> = {
  kraft: {
    name: '牛皮纸',
    desc: '暖黄纸张 · 钢笔手写感',
    vars: {
      '--d-bg': '#f5e6c8',
      '--d-bg-warm': '#ede0b0',
      '--d-spine': '#b8924a',
      '--d-ink': '#3a2010',
      '--d-ink-2': '#7a5020',
      '--d-ink-3': '#b8924a',
      '--d-accent': '#c4a96d',
      '--d-border': 'rgba(139,100,40,.2)',
      '--d-line': 'rgba(139,100,40,.12)',
      '--d-font-body': "'Caveat', cursive",
      '--d-font-title': "'Shippori Mincho', serif",
    },
  },
  washi: {
    name: '和风手帐',
    desc: '日系淡彩 · 贴纸印章风',
    vars: {
      '--d-bg': '#fdfaf6',
      '--d-bg-warm': '#f5ede0',
      '--d-spine': '#d4a0a0',
      '--d-ink': '#5a4838',
      '--d-ink-2': '#8a6858',
      '--d-ink-3': '#b8a090',
      '--d-accent': '#d4a0a0',
      '--d-border': '#e0d4c4',
      '--d-line': '#ede4d8',
      '--d-font-body': "'Noto Serif JP', serif",
      '--d-font-title': "'Shippori Mincho', serif",
    },
  },
  literary: {
    name: '文学日记',
    desc: '深色皮面 · 古典优雅',
    isDark: true,
    vars: {
      '--d-bg': '#1e1a14',
      '--d-bg-warm': '#2a2418',
      '--d-spine': '#0e0c08',
      '--d-ink': 'rgba(220,210,190,.9)',
      '--d-ink-2': 'rgba(196,169,109,.7)',
      '--d-ink-3': 'rgba(196,169,109,.4)',
      '--d-accent': '#c4a96d',
      '--d-border': 'rgba(196,169,109,.2)',
      '--d-line': 'rgba(196,169,109,.08)',
      '--d-font-body': "'Noto Serif JP', serif",
      '--d-font-title': "'Shippori Mincho', serif",
    },
  },
  minimal: {
    name: '现代极简',
    desc: '白纸黑字 · 干净留白',
    vars: {
      '--d-bg': '#ffffff',
      '--d-bg-warm': '#f8f8f8',
      '--d-spine': '#f0f0f0',
      '--d-ink': '#1a1a1a',
      '--d-ink-2': '#5a5a5a',
      '--d-ink-3': '#b0b0b0',
      '--d-accent': '#1a1a1a',
      '--d-border': '#eeeeee',
      '--d-line': '#f5f5f5',
      '--d-font-body': "'Noto Serif JP', serif",
      '--d-font-title': "'Shippori Mincho', serif",
    },
  },
};

/** Inject theme CSS vars onto a DOM element */
export function applyThemeVars(theme: DiaryTheme, el: HTMLElement) {
  const vars = DIARY_THEMES[theme].vars;
  Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
}

export const THEME_PREVIEW_BG: Record<DiaryTheme, string> = {
  kraft: '#f5e6c8',
  washi: '#fdfaf6',
  literary: '#1e1a14',
  minimal: '#ffffff',
};
