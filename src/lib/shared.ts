import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'KeiMaid';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const siteFooter = {
  copyrightOwner: 'CC-BY-SA-4.0 Licensed｜© 2025-2026 KeiMaidDev',
  icp: '苏ICP备2026012452号-1',
  icpUrl: 'https://beian.miit.gov.cn/',
};

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: 'KeiMaidDev',
  repo: 'KeiMaidDocs',
  branch: 'main',
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.webp'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
