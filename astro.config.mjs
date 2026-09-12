// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * markdown 產生的 <table> 沒有外層容器，直接讓表格自己當捲動容器
 * 會導致「要嘛欄位被壓爛、要嘛撐破頁面」的兩難。
 * 這個外掛把每個 table 包進 <div class="table-scroll">，
 * 容器負責限制寬度與捲動，表格本身保持可讀的欄寬。
 */
function rehypeWrapTables() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'element' && child.tagName === 'table') {
          node.children[i] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-scroll'] },
            children: [child],
          };
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}

export default defineConfig({
  site: 'https://addictpsy.net',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeWrapTables],
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
