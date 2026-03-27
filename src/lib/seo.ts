import { siteConfig, siteUrls } from '@/lib/site-config';

const SITE_URL = siteConfig.url;

// ——— 类型定义 ———

interface ArticleSchemaInput {
  title: string;
  excerpt?: string;
  content?: string;
  created_at: string;
  updated_at?: string;
  cover_image?: string;
  image?: string;
  category?: { label?: string } | string;
  author?: { name?: string } | string;
}

// ——— 结构化数据生成 ———

export function generateArticleSchema(post: ArticleSchemaInput) {
  const authorName =
    typeof post.author === 'string' ? post.author : post.author?.name || '博主';
  const section =
    typeof post.category === 'string' ? post.category : post.category?.label || '技术分享';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    author: {
      '@type': 'Person',
      name: authorName,
      url: siteUrls.about,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    image: post.cover_image || post.image || `${SITE_URL}/og-image.jpg`,
    articleBody: post.content ? post.content.substring(0, 300) + '…' : undefined,
    wordCount: post.content ? post.content.split(/\s+/).length : undefined,
    articleSection: section,
  };
}

export function generateBreadcrumbSchema(paths: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: paths.map((path, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: path.name,
      item: `${SITE_URL}${path.url}`,
    })),
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: SITE_URL,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/blog?search=1&q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.name,
    url: siteUrls.about,
    sameAs: [],
  };
}

// ——— 路由分发 ———

export function getPageStructuredData(
  pageType: 'homepage' | 'article' | 'breadcrumb' | string,
  data?: ArticleSchemaInput | Array<{ name: string; url: string }>
) {
  switch (pageType) {
    case 'homepage':
      return generateWebsiteSchema();
    case 'article':
      return data ? generateArticleSchema(data as ArticleSchemaInput) : null;
    case 'breadcrumb':
      return data ? generateBreadcrumbSchema(data as Array<{ name: string; url: string }>) : null;
    default:
      return null;
  }
}
