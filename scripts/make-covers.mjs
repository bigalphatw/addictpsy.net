/**
 * 產生文章封面圖（純向量，無文字）。
 *
 * 為什麼不用圖庫照片：成癮與精神疾病主題的庫存照多半是污名化的視覺
 * （藥丸、酒瓶、抱頭的人），且每張 CC 圖都需要獨立標示出處。
 * 抽象幾何既中性又能保持品牌一致。
 *
 * 用法：node scripts/make-covers.mjs
 * 每個 slug 會產生 public/covers/<slug>.svg。
 * 未指定母題的新文章會依 slug 雜湊自動挑一個，所以新增文章不必改這支程式。
 */
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const W = 1200;
const H = 630;
const OUT = 'public/covers';
const POSTS = 'src/content/blog';

// 與網站主色同調的深色系，色相從青綠推移到靛藍
const PALETTES = [
  { a: '#0b1f24', b: '#0f3b3a', line: '#5eead4', glow: '#14b8a6' },
  { a: '#0a1b26', b: '#123245', line: '#7dd3fc', glow: '#0ea5e9' },
  { a: '#101a2b', b: '#1b2a4a', line: '#a5b4fc', glow: '#6366f1' },
  { a: '#0d2020', b: '#14413a', line: '#6ee7b7', glow: '#10b981' },
  { a: '#141a2e', b: '#27304f', line: '#c4b5fd', glow: '#8b5cf6' },
];

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

/** 疊層正弦波，振幅由平緩逐漸放大 —— 用於「機制逐步失控」 */
const waves = (p) => {
  // 取樣間隔要夠大、波長要夠長，否則會變成一團鋸齒雜訊
  const STEP = 24;
  const WAVELEN = 420;
  let out = '';
  for (let i = 0; i < 6; i++) {
    const amp = 6 + i * i * 3.2;          // 前段平緩、後段陡升
    const y = 120 + i * 78;
    const phase = i * 0.7;
    const pts = [];
    for (let x = -40; x <= W + 40; x += STEP) {
      const yy = y + Math.sin((x / WAVELEN) * Math.PI * 2 + phase) * amp;
      pts.push(`${x},${yy.toFixed(1)}`);
    }
    out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${p.line}" stroke-width="${(1.4 + i * 0.5).toFixed(1)}" opacity="${(0.22 + i * 0.13).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return out;
};

/** 逐級下降的柱體 —— 用於「階梯式減量」 */
const taper = (p) => {
  let out = '';
  const n = 11;
  for (let i = 0; i < n; i++) {
    const bw = 58;
    const gap = 26;
    const x = 150 + i * (bw + gap);
    const h = 330 * Math.pow(0.85, i) + 26;
    const y = H - 150 - h;
    const op = (0.85 - i * 0.06).toFixed(2);
    out += `<rect x="${x}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="14" fill="${p.line}" opacity="${op}"/>`;
  }
  return out;
};

/** 上升階梯 —— 用於「治療選項的層次」 */
const steps = (p) => {
  let out = '';
  const n = 6;
  for (let i = 0; i < n; i++) {
    const sw = 150;
    const x = 120 + i * sw;
    const h = 70 + i * 62;
    const y = H - 130 - h;
    out += `<rect x="${x}" y="${y}" width="${sw - 18}" height="${h}" rx="16" fill="${p.line}" opacity="${(0.28 + i * 0.11).toFixed(2)}"/>`;
  }
  return out;
};

/** 兩條交纏的曲線 —— 用於「共病互相牽動」 */
const weave = (p) => {
  const curve = (phase, amp, sw, op) => {
    let d = `M -40 ${H / 2}`;
    for (let x = -40; x <= W + 40; x += 28) {
      const y = H / 2 + Math.sin(x / 190 + phase) * amp;
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    return `<path d="${d}" fill="none" stroke="${p.line}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round"/>`;
  };
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += curve(i * 0.5, 120 - i * 8, 2.5, (0.2 + i * 0.12).toFixed(2));
    out += curve(Math.PI + i * 0.5, 120 - i * 8, 2.5, (0.14 + i * 0.09).toFixed(2));
  }
  return out;
};

/** 同心弧線，外圈托住內圈 —— 用於「陪伴與支持」 */
const arcs = (p) => {
  let out = '';
  for (let i = 0; i < 8; i++) {
    const r = 90 + i * 62;
    out += `<circle cx="${W / 2}" cy="${H + 60}" r="${r}" fill="none" stroke="${p.line}" stroke-width="${2.4 - i * 0.14}" opacity="${(0.62 - i * 0.06).toFixed(2)}"/>`;
  }
  return out;
};

const MOTIFS = { waves, taper, steps, weave, arcs };
const MOTIF_NAMES = Object.keys(MOTIFS);

// 明確指定的母題；未列出的文章會依 slug 雜湊自動挑選
const ASSIGNED = {
  'how-addiction-changes-the-brain': 'waves',
  'sleeping-pill-dependence': 'taper',
  'alcohol-use-disorder-treatment': 'steps',
  'depression-and-substance-use': 'weave',
  'supporting-a-loved-one': 'arcs',
};

function build(slug) {
  const h = hash(slug);
  const p = PALETTES[h % PALETTES.length];
  const motif = ASSIGNED[slug] ?? MOTIF_NAMES[h % MOTIF_NAMES.length];
  const body = MOTIFS[motif](p);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.a}"/>
      <stop offset="1" stop-color="${p.b}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.75" cy="0.18" r="0.85">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="frame"><rect width="${W}" height="${H}"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    ${body}
  </g>
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
const slugs = readdirSync(POSTS)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));

for (const slug of slugs) {
  const svg = build(slug);
  writeFileSync(join(OUT, `${slug}.svg`), svg);
  console.log(`[covers] ${slug}.svg  (${(svg.length / 1024).toFixed(1)} KB, ${ASSIGNED[slug] ?? 'auto'})`);
}
console.log(`[covers] 共 ${slugs.length} 張`);
