export interface Novel {
  slug: string;
  title: string;
  originalTitle: string;
  author: string;
  filePath: string;
  sourceName: string;
  sourceUrl: string;
  gutenbergId: string;
  mediaTitles: string[];
}

export interface WebNovel {
  title: string;
  author: string;
  platform: string;
  status: string;
  genre: string;
  officialUrl: string;
  note: string;
}

export const NOVELS: Novel[] = [
  {
    slug: 'hong-lou-meng',
    title: '红楼梦',
    originalTitle: '紅樓夢',
    author: '曹雪芹',
    filePath: '/novels/hong-lou-meng.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/24264',
    gutenbergId: '24264',
    mediaTitles: ['红楼梦', '紅樓夢'],
  },
  {
    slug: 'san-guo-yan-yi',
    title: '三国演义',
    originalTitle: '三國志演義',
    author: '罗贯中',
    filePath: '/novels/san-guo-yan-yi.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23950',
    gutenbergId: '23950',
    mediaTitles: ['三国演义', '三國演義', '三國志演義'],
  },
  {
    slug: 'shui-hu-zhuan',
    title: '水浒传',
    originalTitle: '水滸傳',
    author: '施耐庵',
    filePath: '/novels/shui-hu-zhuan.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23863',
    gutenbergId: '23863',
    mediaTitles: ['水浒传', '水滸傳'],
  },
  {
    slug: 'xi-you-ji',
    title: '西游记',
    originalTitle: '西遊記',
    author: '吴承恩',
    filePath: '/novels/xi-you-ji.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23962',
    gutenbergId: '23962',
    mediaTitles: ['西游记', '西遊記'],
  },
  {
    slug: 'liao-zhai-zhi-yi',
    title: '聊斋志异',
    originalTitle: '聊齋志異',
    author: '蒲松龄',
    filePath: '/novels/liao-zhai-zhi-yi.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/51828',
    gutenbergId: '51828',
    mediaTitles: ['聊斋志异', '聊齋志異'],
  },
  {
    slug: 'ru-lin-wai-shi',
    title: '儒林外史',
    originalTitle: '儒林外史',
    author: '吴敬梓',
    filePath: '/novels/ru-lin-wai-shi.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/24032',
    gutenbergId: '24032',
    mediaTitles: ['儒林外史'],
  },
  {
    slug: 'feng-shen-yan-yi',
    title: '封神演义',
    originalTitle: '封神演義',
    author: '陆西星',
    filePath: '/novels/feng-shen-yan-yi.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23910',
    gutenbergId: '23910',
    mediaTitles: ['封神演义', '封神演義'],
  },
  {
    slug: 'jing-hua-yuan',
    title: '镜花缘',
    originalTitle: '鏡花緣',
    author: '李汝珍',
    filePath: '/novels/jing-hua-yuan.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23818',
    gutenbergId: '23818',
    mediaTitles: ['镜花缘', '鏡花緣'],
  },
  {
    slug: 'lao-can-you-ji',
    title: '老残游记',
    originalTitle: '老殘遊記',
    author: '刘鹗',
    filePath: '/novels/lao-can-you-ji.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/25124',
    gutenbergId: '25124',
    mediaTitles: ['老残游记', '老殘遊記'],
  },
  {
    slug: 'guan-chang-xian-xing-ji',
    title: '官场现形记',
    originalTitle: '官場現形記',
    author: '李宝嘉',
    filePath: '/novels/guan-chang-xian-xing-ji.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/24138',
    gutenbergId: '24138',
    mediaTitles: ['官场现形记', '官場現形記'],
  },
  {
    slug: 'er-shi-nian-mu-du-zhi-guai-xian-zhuang',
    title: '二十年目睹之怪现状',
    originalTitle: '二十年目睹之怪現狀',
    author: '吴趼人',
    filePath: '/novels/er-shi-nian-mu-du-zhi-guai-xian-zhuang.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/24099',
    gutenbergId: '24099',
    mediaTitles: ['二十年目睹之怪现状', '二十年目睹之怪現狀'],
  },
  {
    slug: 'nie-hai-hua',
    title: '孽海花',
    originalTitle: '孽海花',
    author: '曾朴',
    filePath: '/novels/nie-hai-hua.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/25128',
    gutenbergId: '25128',
    mediaTitles: ['孽海花'],
  },
  {
    slug: 'san-xia-wu-yi',
    title: '三侠五义',
    originalTitle: '三俠五義',
    author: '石玉昆',
    filePath: '/novels/san-xia-wu-yi.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/25376',
    gutenbergId: '25376',
    mediaTitles: ['三侠五义', '三俠五義'],
  },
  {
    slug: 'hen-hai',
    title: '恨海',
    originalTitle: '恨海',
    author: '吴趼人',
    filePath: '/novels/hen-hai.txt',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23865',
    gutenbergId: '23865',
    mediaTitles: ['恨海'],
  },
];

export const WEB_NOVELS: WebNovel[] = [
  {
    title: '诡秘之主',
    author: '爱潜水的乌贼',
    platform: '起点中文网',
    status: '已完结',
    genre: '西幻 / 克苏鲁 / 蒸汽朋克',
    officialUrl: 'https://www.qidian.com/book/1010868264/',
    note: '现象级群像与世界观，适合长线沉浸阅读。',
  },
  {
    title: '大奉打更人',
    author: '卖报小郎君',
    platform: '起点中文网',
    status: '已完结',
    genre: '仙侠 / 探案 / 朝堂',
    officialUrl: 'https://www.qidian.com/book/1019664125/',
    note: '轻喜剧节奏配悬案推进，改编剧集带来持续热度。',
  },
  {
    title: '道诡异仙',
    author: '狐尾的笔',
    platform: '起点中文网',
    status: '已完结',
    genre: '玄幻 / 悬疑 / 怪诞',
    officialUrl: 'https://www.qidian.com/search?kw=道诡异仙',
    note: '高辨识度的精神迷雾与诡异修仙设定。',
  },
  {
    title: '赤心巡天',
    author: '情何以甚',
    platform: '起点中文网',
    status: '连载中',
    genre: '仙侠 / 古典仙侠',
    officialUrl: 'https://www.qidian.com/search?kw=赤心巡天',
    note: '以人物成长和道心抉择见长，长篇追更体验扎实。',
  },
  {
    title: '宿命之环',
    author: '爱潜水的乌贼',
    platform: '起点中文网',
    status: '已完结',
    genre: '西幻 / 悬疑 / 诡秘宇宙',
    officialUrl: 'https://www.qidian.com/search?kw=宿命之环',
    note: '《诡秘之主》系列续作，适合接着补世界线。',
  },
  {
    title: '夜的命名术',
    author: '会说话的肘子',
    platform: '起点中文网',
    status: '已完结',
    genre: '都市 / 异能 / 群像',
    officialUrl: 'https://www.qidian.com/book/1021617576/',
    note: '表世界与里世界并行，爽感和悬念都比较强。',
  },
  {
    title: '绍宋',
    author: '榴弹怕水',
    platform: '起点中文网',
    status: '已完结',
    genre: '历史 / 两宋元明',
    officialUrl: 'https://www.qidian.com/search?kw=绍宋',
    note: '历史向口碑作品，偏硬核但阅读推进感很好。',
  },
  {
    title: '灵境行者',
    author: '卖报小郎君',
    platform: '起点中文网',
    status: '已完结',
    genre: '都市 / 异能 / 副本',
    officialUrl: 'https://www.qidian.com/search?kw=灵境行者',
    note: '副本制和都市异能结合，节奏偏快。',
  },
];

export function getNovelBySlug(slug: string) {
  return NOVELS.find((novel) => novel.slug === slug);
}

export function getNovelForMediaTitle(title: string) {
  return NOVELS.find((novel) => novel.mediaTitles.includes(title));
}
