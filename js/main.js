/* ══════════════════════════════════════════════════════════
   点群計測 × リバースエンジニアリング 提案LP — UI制御スクリプト
   株式会社アイシーイー（ICE）

   概要:
     1. ヒーロー背景の点群（ドットクラウド）SVG生成＋明滅アニメーション
     2. ハンバーガーメニュー（モバイル）
     3. スクロールスパイ（現在セクションのナビ強調）
     4. IntersectionObserver によるスクロール連動の表示アニメーション
     5. チェックリスト進捗カウンタ
     6. 印刷ボタン（Ctrl/Cmd+P を発火）

   依存: なし（純粋なブラウザAPIのみ。CDN・外部ライブラリ不使用）
══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ════════════════════════════════════════════
     0. 決定論的疑似乱数（XORShift32）
     毎回同じ点群が生成されるように seed を固定。
     Math.random() 不使用のため、読み込みごとの見た目がブレない。
  ════════════════════════════════════════════ */
  function createRng(seed) {
    var state = seed >>> 0;
    return function () {
      state ^= state << 13; state >>>= 0;
      state ^= state >> 17;
      state ^= state << 5;  state >>>= 0;
      return state / 4294967296; // [0, 1)
    };
  }

  /* ════════════════════════════════════════════
     1. ヒーロー背景：点群（ドットクラウド）の生成
     - 治具の輪郭を想起させる台形のクラスタ領域を定義し、
       その内部に濃度ムラのある点を散らす
     - 一部の点はクラス（pc-dim / pc-bright / pc-core）を持ち、
       CSSで段階的に明滅アニメーションさせる
  ════════════════════════════════════════════ */
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function buildPointcloud() {
    var svg = document.getElementById('pointcloud-svg');
    if (!svg) return;

    var rng = createRng(20260818); // seed = 作成日。変更すると模様が変わる
    var W = 1200, H = 800;

    // クラスタ定義: 治具っぽい矩形ブロック（ベース・柱・クランプアームを模擬）
    // それぞれ [x, y, w, h, density] — density は点の発生密度（0-1）
    var clusters = [
      // ベースフレーム（下段の横長ブロック）
      { x: 120, y: 560, w: 960, h: 120, density: 0.9 },
      // 左柱・右柱（立ち上げ）
      { x: 170, y: 300, w: 130, h: 280, density: 0.8 },
      { x: 900, y: 300, w: 130, h: 280, density: 0.8 },
      // クランプアーム（上段の横棒）
      { x: 170, y: 250, w: 860, h: 70,  density: 0.7 },
      // 位置決めピン相当の小ブロック
      { x: 380, y: 470, w: 90,  h: 90,  density: 1.0 },
      { x: 730, y: 470, w: 90,  h: 90,  density: 1.0 },
      // 浮遊ノイズ（背景全体に薄く）
      { x: 0,   y: 0,   w: W,   h: H,   density: 0.12 }
    ];

    // 面積あたりの点数係数。1200x800のヒーロー全面で約1,600点になる調整値。
    // （点数 = w*h*density*COUNT_PER_AREA/10000 — 1万画素あたりの点数と読む）
    // ※ 6,000点超にするとモバイルでアニメーション負荷が問題になるため抑え目。
    var COUNT_PER_AREA = 46;

    clusters.forEach(function (c) {
      var area = c.w * c.h;
      var count = Math.round(area * COUNT_PER_AREA * c.density / 10000);
      for (var i = 0; i < count; i++) {
        var px = c.x + rng() * c.w;
        var py = c.y + rng() * c.h;

        var circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', px.toFixed(1));
        circle.setAttribute('cy', py.toFixed(1));

        // 半径は対数分布気味に … 中心付近の点を大きく（計測密度のムラ表現）
        var r = 0.8 + rng() * rng() * 2.4;
        circle.setAttribute('r', r.toFixed(2));

        // クラス割当: 明滅の位相を分けるため 3種類 + コア
        var roll = rng();
        if (roll > 0.965) {
          circle.setAttribute('class', 'pc-core');
          circle.setAttribute('r', (r + 1.2).toFixed(2));
        } else if (roll > 0.82) {
          circle.setAttribute('class', 'pc-bright');
        } else if (roll < 0.30) {
          circle.setAttribute('class', 'pc-dim');
        }

        // 明滅アニメーション: 遅延・duration を点ごとにばらす
        circle.style.animation =
          'pcPulse ' + (2.4 + rng() * 3.6).toFixed(2) + 's ease-in-out ' +
          (rng() * 4).toFixed(2) + 's infinite';

        svg.appendChild(circle);
      }
    });
  }

  /* ════════════════════════════════════════════
     2. ハンバーガーメニュー（モバイル）
  ════════════════════════════════════════════ */
  function initHamburger() {
    var btn = document.getElementById('hamburger');
    var nav = document.getElementById('gnav');
    if (!btn || !nav) return;

    function setOpen(open) {
      btn.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    }

    btn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    // リンククリックでメニューを閉じる
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // リサイズでPC幅に戻ったら状態をリセット
    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) setOpen(false);
    });
  }

  /* ════════════════════════════════════════════
     3. スクロールスパイ
     現在表示中のセクションに対応するナビ項目を強調する。
     IntersectionObserver で各セクションの可視状態を監視。
  ════════════════════════════════════════════ */
  function initScrollSpy() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('#gnav a[href^="#"]'));
    if (!navLinks.length || !('IntersectionObserver' in window)) return;

    var map = {}; // sectionId -> link
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      map[id] = a;
    });

    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'))
      .filter(function (s) { return map[s.id]; });

    // rootMargin: ビューポート上端をヘッダー高さ分だけ下げ、
    // 中央やや上を「アクティブ判定ライン」とする
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var link = map[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, {
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ════════════════════════════════════════════
     4. スクロール連動の表示アニメーション（.reveal）
     要素がビューポートに入ったら is-visible を付与。
     非対応ブラウザでは即表示（アニメなし）にフォールバック。
  ════════════════════════════════════════════ */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // 一度表示したら監視を解除
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(targets, function (el) { observer.observe(el); });
  }

  /* ════════════════════════════════════════════
     5. チェックリスト進捗カウンタ
     チェック状態に応じて「n / N」表示とプログレスバーを更新。
     送信はしない（ローカルUIのみ）。
  ════════════════════════════════════════════ */
  function initChecklist() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll('.cl-check'));
    var countEl = document.getElementById('cl-count');
    var barEl = document.getElementById('cl-bar');
    if (!boxes.length || !countEl || !barEl) return;

    function update() {
      var checked = boxes.filter(function (b) { return b.checked; }).length;
      countEl.textContent = checked + ' / ' + boxes.length;
      barEl.style.width = (boxes.length ? (checked / boxes.length) * 100 : 0) + '%';
    }

    boxes.forEach(function (b) { b.addEventListener('change', update); });
    update(); // 初期表示
  }

  /* ════════════════════════════════════════════
     6. 印刷ボタン
     ブラウザの印刷ダイアログを開く（PDF保存にも使う）。
  ════════════════════════════════════════════ */
  function initPrintButton() {
    var btn = document.getElementById('print-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      window.print();
    });
  }

  /* ════════════════════════════════════════════
     初期化
  ════════════════════════════════════════════ */
  function init() {
    buildPointcloud();
    initHamburger();
    initScrollSpy();
    initReveal();
    initChecklist();
    initPrintButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
