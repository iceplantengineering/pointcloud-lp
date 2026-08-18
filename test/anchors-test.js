#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════
   anchors-test.js — 提案LPの静的検証スクリプト

   index.html / css / js を読み込み、以下を検証する:
     1. アンカーリンク（href="#..."）と対応する id の過不足
     2. 外部リソース（CDN・画像・Webフォント）への依存がないこと
     3. 必須記載事項（顧客表記・計測精度・推測注記・連絡先）
     4. HTMLの基本構造（主要セクション・JS/CSS参照・閉じタグの粗検査）

   実行: node test/anchors-test.js   （Exit 0 = 全PASS）
══════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.error('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

console.log('─'.repeat(60));
console.log('点群リバースエンジニアリング提案LP — 静的検証');
console.log('─'.repeat(60));

/* ── ファイル存在 ── */
console.log('\n[1] ファイル構成');
['index.html', 'css/style.css', 'js/main.js', 'README.md'].forEach((f) => {
  check('存在: ' + f, fs.existsSync(path.join(ROOT, f)));
});

const html = read('index.html');
const css = read('css/style.css');
const js = read('js/main.js');

/* ── アンカーリンク整合 ── */
console.log('\n[2] アンカーリンク（href ↔ id）');
const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const idSet = new Set(ids);

// ユニーク化しつつ全 href を検証
[...new Set(hrefs)].forEach((h) => {
  check('href="#' + h + '" に対応する id が存在', idSet.has(h));
});

// 必須セクションの存在
const requiredSections = ['hero', 'challenges', 'service', 'measurement',
  'scope', 'benchmark', 'process', 'checklist', 'organization', 'contact'];
requiredSections.forEach((id) => {
  check('セクション存在: #' + id, idSet.has(id));
});

// 重複 id の検出
const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
check('重複する id がない', dup.length === 0, '重複: ' + [...new Set(dup)].join(', '));

// ナビのリンクが全セクションを指しているか（gnav 内）
const gnavBlock = html.match(/<nav class="gnav"[\s\S]*?<\/nav>/)[0];
const gnavHrefs = [...gnavBlock.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
check('ナビが全10セクション中9つ以上をカバー', new Set(gnavHrefs).size >= 9,
  'カバー数: ' + new Set(gnavHrefs).size);

/* ── 外部リソース非依存 ── */
console.log('\n[3] 外部リソース非依存（CDN・画像・Webフォント不使用）');
const extRefs = [...html.matchAll(/(?:src|href)="(https?:)?\/\/[^"]+"/g)]
  .map((m) => m[0]);
// 許可: icej.co.jp へのリンク（テキストリンクのみ。リソース読み込みではない）
const resourceLoads = extRefs.filter((r) => /(\.js|\.css|\.png|\.jpg|\.svg|\.woff)/.test(r));
check('外部リソースの読み込みがない', resourceLoads.length === 0,
  resourceLoads.join(', '));
check('CSS参照が相対パス', /<link[^>]+href="css\/style\.css"/.test(html));
check('JS参照が相対パス', /<script src="js\/main\.js">/.test(html));
// 画像はローカルファイル（images/）のみ許可。外部URLからの読み込みは禁止
const imgs = [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]);
check('img はローカルファイルのみ（外部読み込みなし）', imgs.length >= 1 && imgs.every((s) => !/^(https?:)?\/\//.test(s)), imgs.join(', '));

/* ── 必須記載事項 ── */
console.log('\n[4] 必須記載事項');
check('FAROアーム精度 0.05mm の記載', /0\.05\s*mm/.test(html.replace(/<[^>]+>/g, ' ')));
check('レーザートラッカー精度 0.1mm の記載', /0\.1\s*mm/.test(html.replace(/<[^>]+>/g, ' ')));
check('顧客名「H-ONE」表記', html.includes('H-ONE'));
check('「一番」表記を不使用', !html.includes('一番'));
check('ナベヤ製作所の記載', html.includes('ナベヤ製作所'));
check('岐阜県の記載', html.includes('岐阜県'));
check('JIT（JI Technovation）ベンチマークの記載', html.includes('JIT'));
check('マルチスズキの記載', html.includes('マルチスズキ'));
check('JITセクションに推測の注記', /推測/.test(html) && /参考ベンチマーク/.test(html));
check('icej.co.jp の記載', html.includes('icej.co.jp'));
check('トライアル1台のCTA文言', /1台から/.test(html));
check('使用目的・使用環境の確認方針', /使用目的/.test(html) && /使用環境/.test(html));

/* ── HTML 構造の粗検査 ── */
console.log('\n[5] HTML構造');
// 主要閉じタグの対応数
const count = (re) => (html.match(re) || []).length;
check('<section> の開閉一致', count(/<section[\s>]/g) === count(/<\/section>/g),
  count(/<section[\s>]/g) + ' vs ' + count(/<\/section>/g));
check('<div> の開閉一致', count(/<div[\s>]/g) === count(/<\/div>/g),
  count(/<div[\s>]/g) + ' vs ' + count(/<\/div>/g));
check('<svg> の開閉一致', count(/<svg[\s>]/g) === count(/<\/svg>/g),
  count(/<svg[\s>]/g) + ' vs ' + count(/<\/svg>/g));
check('<fieldset> の開閉一致', count(/<fieldset[\s>]/g) === count(/<\/fieldset>/g));
check('<table> の開閉一致', count(/<table[\s>]/g) === count(/<\/table>/g));
// 壊れタグのパターン（過去の生成ミス対策）
check('壊れた属性パターンがない', !/ x 14 y=/.test(html) && !/<rct|<座 |<\/n>|markerH=|url-data-x/.test(html));
check('lang="ja" 指定', /<html lang="ja">/.test(html));
check('viewport meta 指定', /name="viewport"/.test(html));

/* ── CSS / JS の要件 ── */
console.log('\n[6] CSS・JS要件');
check('print CSS 実装', /@media print/.test(css));
check('レスポンシブ（メディアクエリ）実装', /@media \(max-width/.test(css));
check('ハンバーガー用スタイル', /\.hamburger/.test(css));
check('IntersectionObserver 利用', js.includes('IntersectionObserver'));
check('チェックリスト進捗の実装', js.includes('cl-count') && js.includes('cl-bar'));
check('印刷ボタンの実装', js.includes('print-btn') && js.includes('window.print'));
check('点群SVG生成の実装', js.includes('pointcloud-svg'));
check('スムーススクロール', /scroll-behavior:\s*smooth/.test(css));
check('reduced-motion 対応', /prefers-reduced-motion/.test(css));

/* ── 日本語 / English 切替（i18n） ── */
console.log('\n[7] 言語切替（i18n）');
const i18n = read('js/i18n.js');

// 辞書オブジェクトを抽出
const dictBlock = i18n.match(/var I18N_EN = (\{[\s\S]*?\n  \})/);
let dict = {};
if (dictBlock) {
  try { dict = eval('(' + dictBlock[1] + ')'); } catch (e) { dict = {}; }
}
check('i18n.js の辞書が読み込める', Object.keys(dict).length > 100, 'エントリ数: ' + Object.keys(dict).length);
check('言語切替ボタン（#lang-toggle）が存在', /id="lang-toggle"/.test(html));
check('i18n.js が読み込まれている', /<script src="js\/i18n\.js"><\/script>/.test(html));
check('html lang="ja" が既定', /<html lang="ja">/.test(html));
check('localStorage 保存ロジック', i18n.includes('localStorage') && i18n.includes('pointcloud-lp-lang'));

// data-i18n-attr のキーが全て辞書にあるか
const attrKeys = [...html.matchAll(/data-i18n-attr="([^"]+)"/g)].map((m) => m[1]);
const attrMissing = attrKeys.filter((k) => !dict[k]);
check('属性キーが全て辞書にある', attrMissing.length === 0, '欠落: ' + attrMissing.join(' / '));

// 日本語テキストノードが全て辞書にあるか（簡易トークナイザ）
const tokens = [];
const tre = /<!--[\s\S]*?-->|<\/[a-zA-Z][^>]*>|<[a-zA-Z][^>]*>|[^<]+/g;
let tm;
while ((tm = tre.exec(html))) tokens.push(tm[0]);
const normT = (s) => s.replace(/\s+/g, ' ').trim();
const hasJP = (s) => /[ぁ-んァ-ヶ一-龠]/.test(s);
const jpNodes = new Set();
let skip = 0;
for (const t of tokens) {
  if (t.startsWith('<!--')) continue;
  if (t.startsWith('</')) { const tag = t.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)/)[1]; if (['script', 'style'].includes(tag)) skip = Math.max(0, skip - 1); continue; }
  if (t.startsWith('<')) { const tag = t.match(/^<([a-zA-Z][a-zA-Z0-9]*)/); if (tag && ['script', 'style'].includes(tag[1])) skip++; continue; }
  if (skip === 0) { const n = normT(t); if (n.length >= 1 && hasJP(n)) jpNodes.add(n); }
}
const textMissing = [...jpNodes].filter((k) => !dict[k]);
check('日本語テキストが全て辞書にある（' + jpNodes.size + '件）', textMissing.length === 0, '欠落: ' + textMissing.slice(0, 8).join(' / '));

// EN値に日本語が残っていないか（プロパー名の日本語なしを確認）
const jpInEn = Object.entries(dict).filter(([, v]) => hasJP(v)).map(([k]) => k);
check('英語訳に日本語文字が残っていない', jpInEn.length === 0, '該当: ' + jpInEn.slice(0, 5).join(' / '));


console.log('\n' + '─'.repeat(60));
console.log('結果: ' + pass + ' PASS / ' + fail + ' FAIL');
console.log('─'.repeat(60));
process.exit(fail ? 1 : 0);
