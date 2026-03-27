const DEFAULT_SITE_URL = 'https://www.artchain.icu';
const DEFAULT_SITE_NAME = 'Lumen';
const DEFAULT_SITE_DESCRIPTION = '在文字中拾起生活的微光';

export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
  name: process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME,
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    process.env.NEXT_PUBLIC_SITE_DESC ||
    DEFAULT_SITE_DESCRIPTION,
};

export const siteUrls = {
  home: siteConfig.url,
  ogImage: `${siteConfig.url}/opengraph-image`,
  rss: `${siteConfig.url}/rss.xml`,
  blog: `${siteConfig.url}/blog`,
  about: `${siteConfig.url}/about`,
};
