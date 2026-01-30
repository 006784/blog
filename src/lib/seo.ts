import { getPublishedPosts } from '@/lib/supabase';

// 生成结构化数据的工具函数
export function generateArticleSchema(post: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': post.excerpt || post.title,
    'author': {
      '@type': 'Person',
      'name': post.author?.name || '博主',
      'url': 'https://your-domain.com/about'
    },
    'publisher': {
      '@type': 'Organization',
      'name': '拾光博客',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://your-domain.com/logo.png'
      }
    },
    'datePublished': post.created_at,
    'dateModified': post.updated_at || post.created_at,
    'image': post.cover_image || 'https://your-domain.com/default-cover.jpg',
    'articleBody': post.content?.substring(0, 200) + '...',
    'wordCount': post.content?.split(' ').length || 0,
    'articleSection': post.category?.label || '技术分享'
  };
}

export function generateBreadcrumbSchema(paths: Array<{name: string, url: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': paths.map((path, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': path.name,
      'item': `https://your-domain.com${path.url}`
    }))
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': '拾光博客',
    'url': 'https://your-domain.com',
    'description': '分享技术与生活的个人博客',
    'publisher': {
      '@type': 'Organization',
      'name': '拾光博客'
    },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://your-domain.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}

// 为不同页面类型生成合适的结构化数据
export function getPageStructuredData(pageType: string, data?: any) {
  switch (pageType) {
    case 'homepage':
      return generateWebsiteSchema();
    case 'article':
      return generateArticleSchema(data);
    case 'breadcrumb':
      return generateBreadcrumbSchema(data);
    default:
      return null;
  }
}