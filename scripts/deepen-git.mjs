/**
 * Cloudflare Pages 只會 clone 單一 commit（淺層），
 * 導致 `git log -- <file>` 看不到歷史，「最後更新時間」永遠算不出來。
 * 這支腳本在建置前把歷史補回來；失敗時安靜退出，
 * 讓 posts.ts 退回使用 pubDate，不會讓整個建置壞掉。
 */
import { execFileSync } from 'node:child_process';

const run = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const tryRun = (args) => {
  try {
    run(args);
    return true;
  } catch {
    return false;
  }
};

try {
  const shallow = run(['rev-parse', '--is-shallow-repository']) === 'true';
  if (!shallow) {
    console.log('[deepen-git] 已有完整歷史，略過');
  } else if (tryRun(['fetch', '--unshallow', '--quiet'])) {
    console.log('[deepen-git] --unshallow 成功');
  } else if (tryRun(['fetch', '--deepen=500', '--quiet'])) {
    console.log('[deepen-git] --deepen=500 成功');
  } else {
    console.warn('[deepen-git] 無法取得歷史，更新時間將退回使用 pubDate');
  }
  console.log(`[deepen-git] 目前可見提交數: ${run(['rev-list', '--count', 'HEAD'])}`);
} catch (err) {
  console.warn('[deepen-git] 略過:', err.message.split('\n')[0]);
}
