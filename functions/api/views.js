/**
 * 瀏覽計數器 — Cloudflare Pages Function
 *   GET  /api/views        → 一次回傳所有文章的計數（給首頁卡片用，唯讀、不加一）
 *   POST /api/views {slug} → 該篇加一並回傳新數字（只有文章頁會呼叫）
 * 不需要任何 API 金鑰：權限來自 wrangler.toml 的 KV 綁定。
 */
const PREFIX = 'post:';
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const NO_CACHE = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' };

export async function onRequestGet({ env }) {
  const out = {};
  let cursor;
  do {
    const list = await env.VIEWS.list({ prefix: PREFIX, cursor });
    await Promise.all(
      list.keys.map(async (k) => {
        const v = await env.VIEWS.get(k.name);
        out[k.name.slice(PREFIX.length)] = Number.parseInt(v ?? '0', 10) || 0;
      })
    );
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return new Response(JSON.stringify(out), { headers: NO_CACHE });
}

export async function onRequestPost({ request, env }) {
  let slug = null;
  try { ({ slug } = await request.json()); } catch { /* 忽略格式錯誤 */ }
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    return new Response(JSON.stringify({ error: 'invalid slug' }), { status: 400, headers: NO_CACHE });
  }
  const key = PREFIX + slug;
  const current = Number.parseInt((await env.VIEWS.get(key)) ?? '0', 10) || 0;
  const views = current + 1;
  await env.VIEWS.put(key, String(views));
  return new Response(JSON.stringify({ slug, views }), { headers: NO_CACHE });
}
