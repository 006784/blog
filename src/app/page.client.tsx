'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';

const HERO_QUOTES = [
  // 王国维《人间词话》
  { text: '词以境界为最上。有境界则自成高格，自有名句。', author: '王国维《人间词话》' },
  { text: '有我之境，以我观物，故物皆著我之色彩。无我之境，以物观物，故不知何者为我，何者为物。', author: '王国维《人间词话》' },
  { text: '一切景语皆情语也。', author: '王国维《人间词话》' },
  { text: '诗人对宇宙人生，须入乎其内，又须出乎其外。入乎其内，故能写之；出乎其外，故能观之。', author: '王国维《人间词话》' },
  { text: '入乎其内，故有生气；出乎其外，故有高致。', author: '王国维《人间词话》' },
  { text: '境非独谓景物也。喜怒哀乐，亦人心中之一境界。', author: '王国维《人间词话》' },
  { text: '词人者，不失其赤子之心者也。', author: '王国维《人间词话》' },
  { text: '大家之作，其言情也必沁人心脾，其写景也必豁人耳目。其词脱口而出，无矫揉妆束之态。', author: '王国维《人间词话》' },
  { text: '有造境，有写境，此理想与写实二派之所由分。', author: '王国维《人间词话》' },
  { text: '天才者，或数十年而一出，或数百年而一出，而又须济之以学问，助之以德性，始能产生第一流之作品。', author: '王国维《人间词话》' },
  { text: '古今之成大事业、大学问者，必经过三种之境界。', author: '王国维《人间词话》' },
  { text: '昨夜西风凋碧树，独上高楼，望尽天涯路。此第一境也。', author: '王国维《人间词话》引晏殊' },
  { text: '衣带渐宽终不悔，为伊消得人憔悴。此第二境也。', author: '王国维《人间词话》引柳永' },
  { text: '众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。此第三境也。', author: '王国维《人间词话》引辛弃疾' },
  { text: '境界有大小，不以是而分优劣。', author: '王国维《人间词话》' },
  { text: '言气质，言神韵，不若言境界。有境界，本也；气质、神韵，末也。', author: '王国维《人间词话》' },
  { text: '能写真景物、真感情者，谓之有境界；否则谓之无境界。', author: '王国维《人间词话》' },
  { text: '以血书者也。', author: '王国维《人间词话》论南唐二主' },
  { text: '主观之诗人，不必多阅世。阅世愈浅，则性情愈真。', author: '王国维《人间词话》' },
  { text: '客观之诗人，须多阅世。阅世愈深，则材料愈丰富，愈变化无穷。', author: '王国维《人间词话》' },
  { text: '词之为体，要眇宜修，能言诗之所不能言，而不能尽言诗之所能言。', author: '王国维《人间词话》' },
  { text: '诗之境阔，词之言长。', author: '王国维《人间词话》' },
  { text: '明月照积雪，北风劲且哀，终古遗恨，此景最关情。', author: '王国维《人间词话》' },
  { text: '寥寥十四字，深谷苍崖，有一唱三叹之妙，此词中之最工者。', author: '王国维《人间词话》' },
  { text: '词至李后主而眼界始大，感慨遂深，遂变伶工之词而为士大夫之词。', author: '王国维《人间词话》' },
  { text: '尼采谓：一切文学，余爱以血书者。后主之词，真所谓以血书者也。', author: '王国维《人间词话》' },
  { text: '昔为倡家女，今为荡子妇。荡子行不归，空床难独守。此真可谓以血书者也。', author: '王国维《人间词话》' },
  { text: '最是人间留不住，朱颜辞镜花辞树。', author: '王国维《蝶恋花》' },
  { text: '试上高峰窥皓月，偶开天眼觑红尘，可怜身是眼中人。', author: '王国维《浣溪沙》' },
  { text: '人生只似风前絮，欢也零星，悲也零星，都作连江点点萍。', author: '王国维《采桑子》' },
  { text: '恰似一江春水向东流，流不尽，许多愁。', author: '王国维《浣溪沙》' },
  { text: '四时可爱唯春日，一事能狂便少年。', author: '王国维《晓步》' },
  { text: '万古销沉感不胜，西风目断乱峰层。', author: '王国维《浣溪沙》' },
  { text: '立于客观，以业此文学之人，所其理想之实现于外物者，见之于著作，是曰写境。', author: '王国维《人间词话》' },
  { text: '红杏枝头春意闹，著一闹字而境界全出。', author: '王国维《人间词话》' },
  { text: '云破月来花弄影，著一弄字而境界全出。', author: '王国维《人间词话》' },
  // 古诗词
  { text: '此心安处是吾乡。', author: '苏轼《定风波》' },
  { text: '人生如逆旅，我亦是行人。', author: '苏轼《临江仙》' },
  { text: '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。', author: '苏轼《定风波》' },
  { text: '江山留胜迹，我辈复登临。', author: '孟浩然《与诸子登岘山》' },
  { text: '但愿人长久，千里共婵娟。', author: '苏轼《水调歌头》' },
  { text: '问君能有几多愁，恰似一江春水向东流。', author: '李煜《虞美人》' },
  { text: '不识庐山真面目，只缘身在此山中。', author: '苏轼《题西林壁》' },
  { text: '采菊东篱下，悠然见南山。', author: '陶渊明《饮酒》' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白《行路难》' },
  { text: '春风得意马蹄疾，一日看尽长安花。', author: '孟郊《登科后》' },
  { text: '海内存知己，天涯若比邻。', author: '王勃《送杜少府之任蜀州》' },
  { text: '莫愁前路无知己，天下谁人不识君。', author: '高适《别董大》' },
  { text: '明月松间照，清泉石上流。', author: '王维《山居秋暝》' },
  { text: '独坐幽篁里，弹琴复长啸。', author: '王维《竹里馆》' },
  { text: '会当凌绝顶，一览众山小。', author: '杜甫《望岳》' },
  { text: '烽火连三月，家书抵万金。', author: '杜甫《春望》' },
  { text: '举头望明月，低头思故乡。', author: '李白《静夜思》' },
  { text: '天生我材必有用，千金散尽还复来。', author: '李白《将进酒》' },
  { text: '春色满园关不住，一枝红杏出墙来。', author: '叶绍翁《游园不值》' },
  { text: '落红不是无情物，化作春泥更护花。', author: '龚自珍《己亥杂诗》' },
  { text: '山重水复疑无路，柳暗花明又一村。', author: '陆游《游山西村》' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游《冬夜读书示子聿》' },
  { text: '王师北定中原日，家祭无忘告乃翁。', author: '陆游《示儿》' },
  { text: '衣带渐宽终不悔，为伊消得人憔悴。', author: '柳永《蝶恋花》' },
  { text: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处。', author: '辛弃疾《青玉案》' },
  { text: '问渠那得清如许，为有源头活水来。', author: '朱熹《观书有感》' },
  { text: '春蚕到死丝方尽，蜡炬成灰泪始干。', author: '李商隐《无题》' },
  { text: '身无彩凤双飞翼，心有灵犀一点通。', author: '李商隐《无题》' },
  { text: '沉舟侧畔千帆过，病树前头万木春。', author: '刘禹锡《酬乐天扬州初逢席上见赠》' },
  { text: '旧时王谢堂前燕，飞入寻常百姓家。', author: '刘禹锡《乌衣巷》' },
  { text: '东边日出西边雨，道是无晴却有晴。', author: '刘禹锡《竹枝词》' },
  { text: '少壮不努力，老大徒伤悲。', author: '《长歌行》' },
  { text: '岁月不饶人，人亦不饶岁月。', author: '《增广贤文》' },
  { text: '知之者不如好之者，好之者不如乐之者。', author: '《论语》' },
  { text: '己所不欲，勿施于人。', author: '《论语》' },
  { text: '学而不思则罔，思而不学则殆。', author: '《论语》' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原《离骚》' },
  { text: '亦余心之所善兮，虽九死其犹未悔。', author: '屈原《离骚》' },
  // 现当代文学
  { text: '如果有天堂，天堂应该是图书馆的模样。', author: '博尔赫斯' },
  { text: '哪里会有人喜欢孤独，不过是不喜欢失望罢了。', author: '村上春树' },
  { text: '心若没有栖息的地方，到哪里都是在流浪。', author: '三毛' },
  { text: '真正的发现之旅，不在于寻找新大陆，而在于用新的目光看世界。', author: '普鲁斯特' },
  { text: '每个人的生命，都是走向自己的路。', author: '赫尔曼·黑塞' },
  { text: '文学让你看到那些本来对你隐藏着的东西。', author: '卡尔维诺' },
  { text: '秋天是第二个春天，每片叶子都是一朵鲜花。', author: '加缪' },
  { text: '写作是把黑暗翻过来，看看它背面的颜色。', author: '余华' },
  { text: '生活在别处。', author: '米兰·昆德拉' },
  { text: '一个人知道自己为什么而活，就可以忍受任何一种生活。', author: '尼采' },
  { text: '凡是过去，皆为序章。', author: '莎士比亚' },
  { text: '好奇心有其自己的存在理由。', author: '爱因斯坦' },
  { text: '简单是复杂的极致形式。', author: '达·芬奇' },
  { text: '设计不只是看起来漂亮，设计是让它工作起来漂亮。', author: '乔布斯' },
];

import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpenText, CalendarDays, Clock3, ExternalLink, Search } from 'lucide-react';
import { LinkPreviewCard } from '@/components/LinkPreviewCard';
import clsx from 'clsx';
import { SubscribeForm } from '@/components/SubscribeForm';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { getPageStructuredData } from '@/lib/seo';
import { filterRenderablePosts, getSamplePosts, toPublicCatalogPosts } from '@/lib/sample-posts';
import { siteConfig } from '@/lib/site-config';
import { formatDate } from '@/lib/types';
import { getPublishedPosts, type Post as SupabasePost } from '@/lib/supabase';

interface HomePost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  readingTime: string;
  isPinned: boolean;
  pinnedAt: string | null;
  isDemo: boolean;
}

const navItems = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
  { name: '联系', href: '/contact' },
];

const categoryLabels: Record<string, string> = {
  tech: '技术',
  design: '设计',
  life: '生活',
  thoughts: '思考',
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1436978913421-dad2ebd01d17?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1400&q=80',
];

function getCategoryLabel(category: string): string {
  const normalized = category.toLowerCase();
  return categoryLabels[normalized] || category;
}

function extractReadingMinutes(readingTime: string): number | null {
  const matched = readingTime.match(/\d+/);
  if (!matched) return null;

  const value = Number(matched[0]);
  return Number.isFinite(value) ? value : null;
}

function formatIssueDate(date: string): string {
  const parsed = new Date(date);
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

function normalizePost(post: SupabasePost & { is_demo?: boolean }, index: number): HomePost {
  const image = post.cover_image || post.image || fallbackImages[index % fallbackImages.length];

  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.published_at || post.created_at,
    category: getCategoryLabel(post.category),
    tags: Array.isArray(post.tags) ? post.tags : [],
    image,
    readingTime: post.reading_time || '5 分钟',
    isPinned: Boolean(post.is_pinned),
    pinnedAt: post.pinned_at || null,
    isDemo: Boolean(post.is_demo),
  };
}

const fallbackHomePosts = getSamplePosts().map((post, index) => normalizePost(post, index));

function ProgressiveImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={clsx('atelier-image-shell', className, loaded && 'is-loaded')}>
      <span className="atelier-image-placeholder" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : undefined}
        fetchPriority={priority ? 'high' : undefined}
        className="atelier-image"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function EditorialFeatureCard({
  post,
  pinned,
}: {
  post: HomePost;
  pinned: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="atelier-feature-card group overflow-hidden rounded-2xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-xl) transition-transform duration-(--duration-normal) hover:-translate-y-1"
    >
      <div className="atelier-feature-media">
        <ProgressiveImage
          src={post.image}
          alt={post.title}
          className="atelier-feature-image"
          sizes="(max-width: 1024px) 100vw, 48vw"
          priority
        />
        <div className="atelier-feature-overlay" />
        {pinned && (
          <Badge className="atelier-pill is-spotlight border-white/20 bg-white/20 text-white backdrop-blur-xl">
            置顶文章
          </Badge>
        )}
        {post.isDemo && (
          <Badge className="atelier-pill is-demo border-white/25 bg-black/25 text-white backdrop-blur-xl">
            示例文章
          </Badge>
        )}
      </div>

      <div className="atelier-feature-body">
        <p className="atelier-meta-line">
          <span>
            <CalendarDays strokeWidth={1.5} className="h-3.5 w-3.5" />
            {formatDate(post.date)}
          </span>
          <span>
            <Clock3 strokeWidth={1.5} className="h-3.5 w-3.5" />
            {post.readingTime}
          </span>
          <span>{post.category}</span>
        </p>

        <h2>{post.title}</h2>
        <p>{post.description}</p>

        {post.tags.length > 0 && (
          <div className="atelier-tag-row">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="soft" className="atelier-tag bg-(--surface-glass) text-neutral-900 dark:text-neutral-900">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function EditorialStoryCard({ post, index }: { post: HomePost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="atelier-story-card"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="atelier-story-link rounded-xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-sm) transition-all duration-(--duration-normal) hover:-translate-y-1 hover:shadow-(--shadow-lg)"
      >
        <div className="atelier-story-copy">
          <p className="atelier-story-category">{post.category}</p>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
          <div className="atelier-story-meta">
            <span>{formatDate(post.date)}</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
        <span className="atelier-story-arrow">
          <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
        </span>
      </Link>
    </motion.article>
  );
}

function EditorialFeedCard({
  post,
  index,
  emphasized = false,
}: {
  post: HomePost;
  index: number;
  emphasized?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={clsx('atelier-feed-card', emphasized && 'is-emphasized')}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="atelier-feed-link rounded-xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-sm) transition-all duration-(--duration-normal) hover:-translate-y-1 hover:shadow-(--shadow-lg)"
      >
        <ProgressiveImage
          src={post.image}
          alt={post.title}
          className="atelier-feed-thumb"
          sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />

        <div className="atelier-feed-body">
          <div className="atelier-feed-topline">
            <Badge className="atelier-pill">{post.category}</Badge>
            <span className="atelier-feed-reading">{post.readingTime}</span>
          </div>

          {post.isDemo && (
            <Badge variant="soft" className="mb-3 w-fit">
              示例
            </Badge>
          )}

          <h3>{post.title}</h3>
          <p>{post.description}</p>

          <div className="atelier-feed-footer">
            <span>{formatDate(post.date)}</span>
            <span className="atelier-feed-cta">
              阅读全文
              <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function EditorialMemoCard({
  kicker,
  title,
  description,
  items,
  href,
  hrefLabel,
}: {
  kicker: string;
  title: string;
  description: string;
  items: Array<{ label: string; value: string }>;
  href: string;
  hrefLabel: string;
}) {
  return (
    <article className="atelier-note-card">
      <p className="atelier-panel-kicker">{kicker}</p>
      <h3>{title}</h3>
      <p className="atelier-note-description">{description}</p>

      <div className="atelier-note-list">
        {items.map((item) => (
          <div key={item.label} className="atelier-note-row">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <Link href={href} className="atelier-note-link">
        {hrefLabel}
        <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
      </Link>
    </article>
  );
}

function TopicRail({
  categories,
  totalPosts,
}: {
  categories: Array<[string, number]>;
  totalPosts: number;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="atelier-topic-rail" aria-label="内容主题快速入口">
      <span className="atelier-topic-label">快速进入</span>
      {categories.map(([name, count]) => (
        <Link key={name} href={`/blog?category=${encodeURIComponent(name)}`} className="atelier-topic-chip">
          <span>{name}</span>
          <strong>{count}</strong>
        </Link>
      ))}
      <Link href="/blog" className="atelier-topic-chip is-all">
        <span>全部文章</span>
        <strong>{totalPosts}</strong>
      </Link>
    </div>
  );
}

export default function HomePageClient({
  initialPosts = [],
}: {
  initialPosts?: import('@/lib/supabase').Post[];
}) {
  const [posts, setPosts] = useState<HomePost[]>(() =>
    initialPosts.length > 0
      ? toPublicCatalogPosts(initialPosts).map((post, index) => normalizePost(post, index))
      : []
  );
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    document.body.classList.add('atelier-home-route');
    return () => {
      document.body.classList.remove('atelier-home-route');
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPosts = async () => {
      try {
        const data = filterRenderablePosts(toPublicCatalogPosts(await getPublishedPosts()));

        if (!mounted) return;

        if (data.length > 0) {
          const normalizedPosts = data.map((post, index) => normalizePost(post, index));
          const latestPinnedPost = normalizedPosts
            .filter((post) => post.isPinned)
            .sort((a, b) => {
              const aTime = new Date(a.pinnedAt || a.date).getTime();
              const bTime = new Date(b.pinnedAt || b.date).getTime();
              return bTime - aTime;
            })[0];

          const visiblePosts = normalizedPosts.slice(0, 12);
          if (latestPinnedPost && !visiblePosts.some((post) => post.slug === latestPinnedPost.slug)) {
            visiblePosts.unshift(latestPinnedPost);
          }

          setPosts(visiblePosts);
        } else {
          setPosts(fallbackHomePosts);
        }
      } catch (error) {
        console.error('加载文章失败:', error);
        if (mounted && initialPosts.length === 0) {
          setPosts(fallbackHomePosts);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      mounted = false;
    };
  }, [initialPosts.length]);

  useEffect(() => {
    let frameId = 0;

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        setScrollRatio(Math.min(window.scrollY / 240, 1));
        frameId = 0;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const websiteSchema = getPageStructuredData('homepage');
  const activePosts = posts.length > 0 ? posts : fallbackHomePosts;
  const heroQuote = useMemo(
    () => HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)],
    []
  );
  const heroPinnedPost = useMemo(
    () =>
      activePosts
        .filter((post) => post.isPinned)
        .sort((a, b) => {
          const aTime = new Date(a.pinnedAt || a.date).getTime();
          const bTime = new Date(b.pinnedAt || b.date).getTime();
          return bTime - aTime;
        })[0] || null,
    [activePosts]
  );
  const heroPost = heroPinnedPost || activePosts[0];
  const remainingStories = useMemo(
    () => activePosts.filter((post) => post.slug !== heroPost.slug),
    [activePosts, heroPost.slug]
  );

  const curatedCount =
    remainingStories.length >= 7 ? 3 : remainingStories.length >= 5 ? 2 : remainingStories.length >= 3 ? 1 : 0;
  const curatedPosts = remainingStories.slice(0, curatedCount);
  const feedSource = remainingStories.slice(curatedCount);
  const visiblePosts = feedSource.slice(0, visibleCount);
  const canLoadMore = visibleCount < feedSource.length;

  const topCategories = useMemo(() => {
    const counts = activePosts.reduce<Record<string, number>>((acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [activePosts]);

  const averageReadingMinutes = useMemo(() => {
    const values = activePosts
      .map((post) => extractReadingMinutes(post.readingTime))
      .filter((value): value is number => typeof value === 'number');

    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [activePosts]);

  const averageReadingLabel = averageReadingMinutes ? `${averageReadingMinutes} min` : '慢阅读';
  const leadCategory = topCategories[0]?.[0] || heroPost.category;
  const leadTopics = topCategories.slice(0, 2).map(([name]) => name).join(' · ') || '技术 · 设计';
  const curationNotes = useMemo(
    () => [
      {
        kicker: 'EDITORIAL NOTE',
        title: '本期导读',
        description: `先从《${heroPost.title}》进入，会更容易摸到这座内容站这段时间真正关心的主题与写作节奏。`,
        items: [
          { label: '本期焦点', value: leadCategory },
          { label: '最近刊期', value: formatIssueDate(heroPost.date) },
          { label: '平均阅读', value: averageReadingLabel },
        ],
        href: `/blog/${heroPost.slug}`,
        hrefLabel: '阅读封面文章',
      },
      {
        kicker: 'ARCHIVE MAP',
        title: '第一次来可以这样逛',
        description: '先扫一遍文章档案，再按分类和时间线往下走，会更像在翻一本文字杂志，而不是刷一条信息流。',
        items: [
          { label: '主线主题', value: leadTopics },
          { label: '当前存档', value: `${activePosts.length} 篇` },
          { label: '章节数量', value: `${topCategories.length} 类` },
        ],
        href: '/blog',
        hrefLabel: '进入文章档案',
      },
    ],
    [activePosts.length, averageReadingLabel, heroPost.date, heroPost.slug, heroPost.title, leadCategory, leadTopics, topCategories.length]
  );

  const feedGridStyle = useMemo(
    () =>
      ({
        '--atelier-feed-columns': visiblePosts.length >= 3 ? 3 : Math.max(visiblePosts.length, 1),
      }) as CSSProperties,
    [visiblePosts.length]
  );

  const navStyle = useMemo(
    () =>
      ({
        '--atelier-nav-blur': `${12 + scrollRatio * 10}px`,
        '--atelier-nav-alpha': `${0.68 + scrollRatio * 0.18}`,
      }) as CSSProperties,
    [scrollRatio]
  );

  return (
    <div className="atelier-home">
      <Script id="homepage-structured-data" type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </Script>

      <header className="atelier-nav" style={navStyle}>
        <div className="atelier-scroll-progress" style={{ transform: `scaleX(${scrollRatio})` }} />
        <div className="atelier-shell atelier-nav-row">
          <Link href="/" className="atelier-brand">
            <span className="atelier-brand-mark">拾</span>
            <span className="atelier-brand-copy">
              <strong>{siteConfig.name}</strong>
              <em>Slow digital magazine</em>
            </span>
          </Link>

          <nav className="atelier-nav-links" aria-label="主导航">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={clsx('atelier-nav-link', item.href === '/' && 'is-active')}>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="atelier-nav-actions">
            <Link
              href="/blog?search=1"
              className="atelier-icon-button rounded-full border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-xs)"
              aria-label="搜索文章"
            >
              <Search strokeWidth={1.5} className="h-4 w-4" />
            </Link>
            <Link
              href="/blog"
              className="atelier-ghost-button rounded-full border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-xs) transition-all duration-(--duration-fast) hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
            >
              浏览文章
            </Link>
          </div>
        </div>
      </header>

      <main className="atelier-main">
        <section className="atelier-hero">
          <div className="atelier-shell">
            <div className="atelier-hero-grid">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="atelier-hero-copy"
              >
                <p className="atelier-kicker">独立写作空间&ensp;·&ensp;ESSAY</p>
                <h1>{heroQuote.text}</h1>
                <p className="atelier-quote-author">—— {heroQuote.author}</p>
                <p className="atelier-intro">
                  这里收集技术实践、产品观察和生活札记。你可以从封面文章进入，也可以按主题慢慢翻阅，让每一次打开都有明确的下一步。
                </p>

                <div className="atelier-action-row">
                  <Link
                    href={`/blog/${heroPost.slug}`}
                    className="atelier-primary-button rounded-full shadow-(--shadow-lg) transition-all duration-(--duration-fast) hover:-translate-y-0.5"
                  >
                    <BookOpenText strokeWidth={1.5} className="h-4 w-4" />
                    阅读封面文章
                    <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/about"
                    className="atelier-secondary-button rounded-full border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-xs) transition-all duration-(--duration-fast) hover:-translate-y-0.5"
                  >
                    认识作者
                  </Link>
                </div>

                <TopicRail categories={topCategories} totalPosts={activePosts.length} />

                <div className="atelier-metrics">
                  <div className="atelier-metric-card rounded-xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-sm)">
                    <span>文章存档</span>
                    <strong>{activePosts.length}</strong>
                    <small>持续整理与更新</small>
                  </div>
                  <div className="atelier-metric-card rounded-xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-sm)">
                    <span>平均阅读</span>
                    <strong>{averageReadingLabel}</strong>
                    <small>保留一点慢阅读的节奏</small>
                  </div>
                  <div className="atelier-metric-card rounded-xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-sm)">
                    <span>主题章节</span>
                    <strong>{topCategories.length}</strong>
                    <small>技术、设计、生活与思考</small>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="atelier-feature-wrap"
              >
                <EditorialFeatureCard post={heroPost} pinned={Boolean(heroPinnedPost)} />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="atelier-curation">
          <div className="atelier-shell">
            <div className="atelier-section-head">
              <div>
                <p className="atelier-section-kicker">CURATED&ensp;·&ensp;CHAPTERS</p>
                <h2>精选章节</h2>
              </div>
            </div>

            <div className="atelier-curation-layout">
              <Card variant="glass" className="atelier-category-panel rounded-2xl">
                <p className="atelier-panel-kicker">TOP&ensp;·&ensp;CATEGORIES</p>
                <h3>这个博客最近在写什么</h3>
                <div className="atelier-category-list">
                  {topCategories.map(([name, count]) => (
                    <div key={name} className="atelier-category-row">
                      <div className="atelier-category-copy">
                        <span>{name}</span>
                        <em style={{ transform: `scaleX(${count / Math.max(activePosts.length, 1)})` }} />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="atelier-story-grid">
                {curatedPosts.map((post, index) => (
                  <EditorialStoryCard key={post.slug} post={post} index={index} />
                ))}
                {curationNotes.map((note) => (
                  <EditorialMemoCard
                    key={note.title}
                    kicker={note.kicker}
                    title={note.title}
                    description={note.description}
                    items={note.items}
                    href={note.href}
                    hrefLabel={note.hrefLabel}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="atelier-feed-section">
          <div className="atelier-shell">
            <div className="atelier-section-head is-feed">
              <div>
                <p className="atelier-section-kicker">LATEST&ensp;·&ensp;DISPATCHES</p>
                <h2>最近更新</h2>
              </div>
              <p>延续同一种审美和秩序感，把最新的文章排成一张更适合慢慢浏览的内容墙。</p>
            </div>

            {loading ? (
              <div className="atelier-feed-grid" aria-label="加载中">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className={clsx('atelier-feed-card atelier-feed-skeleton rounded-xl border border-(--border-default) bg-(--surface-panel) p-4', item === 1 && 'is-emphasized')}
                  >
                    <Skeleton className="h-56 w-full rounded-lg" />
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {visiblePosts.length > 0 ? (
                  <div
                    className={clsx('atelier-feed-grid', visiblePosts.length === 1 && 'is-single')}
                    style={feedGridStyle}
                  >
                    {visiblePosts.map((post, index) => (
                      <EditorialFeedCard
                        key={post.slug}
                        post={post}
                        index={index}
                        emphasized={visiblePosts.length >= 3 && index === 0}
                      />
                    ))}
                  </div>
                ) : (
                  <StatePanel
                    tone="empty"
                    title="还没有可展示的文章"
                    description="等第一篇文章发布之后，这里会自动生成首页内容墙。"
                    className="mx-auto max-w-2xl"
                  />
                )}

                {canLoadMore && (
                  <div className="atelier-load-wrap">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + 3)}
                      className="atelier-secondary-button rounded-full border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-xs) transition-all duration-(--duration-fast) hover:-translate-y-0.5"
                    >
                      加载更多文章
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── 每日简报预览 ── */}
        <TodayBriefingSection />

        <section className="atelier-subscribe-section">
          <div className="atelier-shell">
            <div className="atelier-subscribe-card">
              <div className="atelier-subscribe-copy">
                <p className="atelier-section-kicker">NEWSLETTER&ensp;·&ensp;邮件订阅</p>
                <h2>想第一时间看到新文章，就把这份杂志订到邮箱里。</h2>
                <p>
                  不追求高频打扰，只在真正有新内容、新专题或值得收藏的更新时再发给你。
                </p>
                <div className="atelier-subscribe-benefits">
                  <span>低频更新</span>
                  <span>新文与专题提醒</span>
                  <span>可随时退订</span>
                </div>
              </div>

              <div className="atelier-subscribe-form">
                <SubscribeForm />
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}

// ── 首页简报 + 时钟组件 ──────────────────────────────────────────────
interface HomeBriefing {
  id: string; date: string; title: string; content: string;
  mood?: string | null; weather?: string | null;
  links: { title: string; url: string; comment?: string }[];
}

function LiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex flex-col items-end gap-0.5 select-none">
      <span className="font-mono text-2xl sm:text-3xl font-light text-ink tracking-tight tabular-nums leading-none">
        {time}
      </span>
      <span className="text-xs text-ink-ghost">{date}</span>
    </div>
  );
}

function TodayBriefingSection() {
  const [briefing, setBriefing] = useState<HomeBriefing | null | undefined>(undefined);

  useEffect(() => {
    fetch('/api/briefings?today=1')
      .then((r) => r.json())
      .then((d: { briefing: HomeBriefing | null }) => setBriefing(d.briefing))
      .catch(() => setBriefing(null));
  }, []);

  return (
    <section className="atelier-shell pt-12 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-2xl overflow-hidden shadow-(--neu-shadow-sm) border border-(--border-default) border-l-4 border-l-orange-500"
        style={{
          background: 'color-mix(in srgb, var(--surface-raised) 91%, var(--color-orange-500) 9%)',
        }}
      >
        {/* 编辑头部：橙色左边框条 + 标签 + 时钟 */}
        <div
          className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3 border-b border-(--border-default)"
          style={{
            background: 'color-mix(in srgb, var(--surface-raised) 82%, var(--color-orange-500) 18%)',
          }}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="text-xs uppercase tracking-[0.2em] text-ink-muted font-medium">Daily Briefing</span>
          </div>
          <LiveClock />
        </div>

        {/* 简报内容 */}
        <div className="px-5 sm:px-6 pt-5 pb-4">
          {briefing === undefined ? (
            <div className="space-y-3 py-1">
              <div className="h-5 rounded bg-(--surface-overlay) animate-pulse w-2/3" />
              <div className="h-3.5 rounded bg-(--surface-overlay) animate-pulse w-full" />
              <div className="h-3.5 rounded bg-(--surface-overlay) animate-pulse w-11/12" />
              <div className="h-3.5 rounded bg-(--surface-overlay) animate-pulse w-4/5" />
            </div>
          ) : briefing === null ? (
            <div className="py-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange-300 shrink-0" />
              <p className="text-sm text-ink-ghost">今天还没有简报，稍后见。</p>
            </div>
          ) : (
            <>
              {briefing.title && (
                <h3 className="text-xl font-semibold text-ink mb-3 leading-snug tracking-tight">
                  {briefing.title}
                </h3>
              )}
              <p className="text-sm text-ink-secondary leading-7 line-clamp-3">
                {briefing.content.replace(/#+\s/g, '').replace(/\*\*/g, '')}
              </p>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {briefing.links.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-(--surface-overlay) px-2.5 py-0.5 text-xs text-orange-500">
                    <ExternalLink className="h-3 w-3" />
                    {briefing.links.length} 条相关链接
                  </span>
                )}
                {briefing.mood && (
                  <span className="text-xs text-ink-ghost">心情：{briefing.mood}</span>
                )}
                {briefing.weather && (
                  <span className="text-xs text-ink-ghost">天气：{briefing.weather}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end px-5 sm:px-6 pb-4">
          <Link
            href="/briefing"
            className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
          >
            查看全部简报 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
