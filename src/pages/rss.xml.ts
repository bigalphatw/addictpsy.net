import type { APIRoute } from 'astro';
import { getSortedPosts } from '../utils/posts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const posts = await getSortedPosts();
  const base = (site?.toString() ?? 'https://addictpsy.net/').replace(/\/$/, '');

  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.entry.data.title)}</title>
      <link>${base}${p.url}</link>
      <guid isPermaLink="true">${base}${p.url}</guid>
      <description>${esc(p.entry.data.description)}</description>
      <author>${esc(p.entry.data.author)}</author>
      <pubDate>${p.published.toUTCString()}</pubDate>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AddictPsy 衛教文章</title>
    <link>${base}/</link>
    <description>精神醫療與成癮治療的中文衛教資訊</description>
    <language>zh-TW</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
