import { getCollection, type CollectionEntry } from 'astro:content';
import { execFileSync } from 'node:child_process';

/**
 * 讀取檔案的 git 提交歷史。
 * 關鍵細節：第一次 commit 是「建立」而不是「更新」，
 * 所以只有當同一個檔案有 2 筆以上提交時，才算真的被更新過。
 * 否則整批匯入時，每篇文章都會誤標成「今天更新」。
 */
function gitHistory(file: string): { count: number; last: Date | null } {
  try {
    const out = execFileSync('git', ['log', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) return { count: 0, last: null };
    const lines = out.split('\n').filter(Boolean);
    return { count: lines.length, last: new Date(lines[0]) };
  } catch {
    // 建置環境沒有 git 歷史（例如淺層 clone）時安靜退回
    return { count: 0, last: null };
  }
}

export type Post = {
  entry: CollectionEntry<'blog'>;
  slug: string;
  url: string;
  published: Date;
  updated: Date;
  wasUpdated: boolean;
};

export async function getSortedPosts(): Promise<Post[]> {
  const entries = await getCollection('blog', ({ data }) => !data.draft);

  const posts = entries.map((entry) => {
    const file = (entry as any).filePath ?? `src/content/blog/${entry.id}.md`;
    const published = entry.data.pubDate;

    const hist = gitHistory(file);
    const gitUpdated = hist.count > 1 ? hist.last : null;   // 只有改過才算更新
    const updated = entry.data.updatedDate ?? gitUpdated ?? published;

    // 容錯：更新時間不應早於發佈時間
    const safeUpdated = updated < published ? published : updated;

    return {
      entry,
      slug: entry.id,
      url: `/blog/${entry.id}/`,
      published,
      updated: safeUpdated,
      wasUpdated: safeUpdated.getTime() > published.getTime(),
    };
  });

  // 建置日誌診斷：確認雲端環境是否真的取得了 git 歷史
  const updatedCount = posts.filter((p) => p.wasUpdated).length;
  console.log(
    `[posts] ${posts.length} 篇文章，其中 ${updatedCount} 篇偵測到更新紀錄`
  );

  // 需求 7：最新的在前。先比最後更新時間，同時間則比發佈時間，
  // 避免整批匯入時（更新時間全部相同）排序變成隨機。
  return posts.sort(
    (a, b) =>
      b.updated.getTime() - a.updated.getTime() ||
      b.published.getTime() - a.published.getTime()
  );
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Taipei',
  }).format(d);
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
