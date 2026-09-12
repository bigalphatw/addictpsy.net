# addictpsy.net

精神醫療與成癮治療的中文衛教資訊站。

## 技術

- [Astro](https://astro.build) 靜態產生（SSG）
- 部署於 Cloudflare Pages，推送到 `main` 自動更新
- 瀏覽計數器：Cloudflare Pages Functions + KV（`functions/api/views.js`）

## 本機開發

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 產出到 dist/
npm run preview
```

## 新增文章

在 `src/content/blog/` 新增一個 `.md` 檔即可，檔名就是網址：
`src/content/blog/my-post.md` → `https://addictpsy.net/blog/my-post/`

frontmatter 格式：

```yaml
---
title: "文章標題"
description: "摘要，會用在列表卡片與 SEO"
author: "作者名稱"
pubDate: 2026-09-12
category: "治療選項"
tags: ["標籤一", "標籤二"]
draft: false        # true 則不會被發佈
---
```

建置時會自動處理：

- 首頁與文章列表**直接產生靜態 HTML**（不靠 JavaScript 讀取 JSON）
- 卡片依「最後更新時間」排序，最新的在前
- 「最後更新」時間取自該檔案的 git 提交紀錄；**只有真的改過（2 筆以上提交）才會顯示**，
  避免整批匯入時每篇都被誤標成當天更新

## 版面原則

`src/styles/global.css` 的「版面安全網」區塊集中處理防破框規則
（圖片上限、長網址斷行、表格容器內捲動、flex/grid 子項 `min-width: 0`）。
修改樣式時請保留該區塊。

## 授權

首頁主視覺取自 Wikimedia Commons，CC BY 2.0，出處標示於頁尾。
