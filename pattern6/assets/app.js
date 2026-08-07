/* Public AI Knowledge Lab - Pattern 3 / Codex */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu (キーボード操作対応) ---------- */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('gnav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '閉じる' : 'メニュー';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'メニュー';
        btn.focus();
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- hero particles（ナレッジ粒が格子へ整う・装飾） ---------- */
  var cv = document.getElementById('hero-canvas');
  if (cv && !reduced) {
    var ctx = cv.getContext('2d');
    var W, H, pts = [], N = 70, t = 0;
    function size() {
      var r = cv.parentElement.getBoundingClientRect();
      var d = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = W * d; cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function init() {
      pts = [];
      var cols = Math.ceil(Math.sqrt(N * W / Math.max(H, 1)));
      var rows = Math.ceil(N / cols);
      for (var i = 0; i < N; i++) {
        var gx = (i % cols + 0.5) / cols * W;
        var gy = (Math.floor(i / cols) + 0.5) / rows * H;
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
          gx: gx, gy: gy, ph: Math.random() * Math.PI * 2
        });
      }
    }
    function tick() {
      t += 0.004;
      // 0→自由遊泳、1→格子（構造化）へ。ゆっくり往復するメタファ
      var k = (Math.sin(t) + 1) / 2 * 0.045;
      ctx.clearRect(0, 0, W, H);
      var i, j, p;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.vx += (p.gx - p.x) * k * 0.02 + Math.cos(t * 3 + p.ph) * 0.004;
        p.vy += (p.gy - p.y) * k * 0.02 + Math.sin(t * 2.4 + p.ph) * 0.004;
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      }
      ctx.lineWidth = 1;
      for (i = 0; i < pts.length; i++) {
        for (j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 10000) {
            ctx.strokeStyle = 'rgba(34,24,21,' + (0.10 * (1 - d2 / 10000)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        var g = (i % 9 === 0);
        ctx.fillStyle = g ? 'rgba(227,55,46,.55)' : 'rgba(92,80,75,.38)';
        ctx.beginPath(); ctx.arc(p.x, p.y, g ? 2.4 : 1.7, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    size(); init();
    window.addEventListener('resize', function () { size(); init(); });
    requestAnimationFrame(tick);
  }

  /* ---------- demo forms（送信処理は正式公開版で接続） ---------- */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var r = form.querySelector('.form-result');
      if (!r) {
        r = document.createElement('div');
        r.className = 'form-result';
        r.setAttribute('role', 'status');
        form.appendChild(r);
      }
      r.innerHTML = '<b>ご入力ありがとうございます（確認用デモです）。</b><br>本サイトはデザイン検討用の再構成案のため、このフォームからの送信は行われません。送信機能は正式公開の際に接続いたします。お急ぎのご用件は、事務局 <a href="mailto:info@trustedfor.ai">info@trustedfor.ai</a> まで直接メールでお寄せください。';
      r.focus && r.setAttribute('tabindex', '-1');
      r.focus();
      r.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  });
})();

/* ============================================================
   Pattern 4 / INTEGRATED 追加レイヤー（パターン2のディレクションを移植）
   ============================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress bar ---------- */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  function paintBar() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(paintBar); }
  }, { passive: true });
  paintBar();

  /* ---------- ghost numbers（エディトリアル透かし） ---------- */
  document.querySelectorAll('.sec-head:not(.split), .purpose-head, .evidence-copy').forEach(function (sh) {
    var k = sh.querySelector('.kicker');
    if (!k) return;
    var m = k.textContent.trim().match(/^(\d+)\s*[—-]/);
    if (!m) return;
    var g = document.createElement('span');
    g.className = 'ghost-num';
    g.setAttribute('aria-hidden', 'true');
    g.textContent = m[1];
    sh.appendChild(g);
  });

  /* ---------- stat count-up（研究会の現在地） ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        sio.unobserve(e.target);
        var node = e.target.firstChild;
        if (!node || node.nodeType !== 3) return;
        var final = parseInt(node.textContent, 10);
        if (isNaN(final)) return;
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1100, 1);
          node.textContent = Math.round(final * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        node.textContent = '0';
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.status-value').forEach(function (el) { sio.observe(el); });
  }

  /* ---------- フォーム送信完了メッセージ（FormSubmit の _next で ?sent=1 に戻る） ---------- */
  if (/[?&]sent=1/.test(location.search)) {
    var form = document.querySelector('form.form-grid');
    if (form) {
      var done = document.createElement('div');
      done.className = 'form-result';
      done.setAttribute('role', 'status');
      done.setAttribute('tabindex', '-1');
      done.innerHTML = '<b>送信が完了しました。</b><br>お問い合わせ・お申し込みありがとうございます。内容は事務局（info@trustedfor.ai）に届いております。ご返信まで数日いただく場合がございますので、ご了承ください。';
      form.parentNode.insertBefore(done, form);
      done.focus();
      done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
  }
})();

/* ---------- hero 光アニメ: 画像座標に cover 計算で正確に張り付ける ---------- */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var art = document.querySelector('.archive-hero-art');
  var img = art && art.querySelector('img');
  var layer = art && art.querySelector('.hero-lights');
  if (!art || !img || !layer) return;

  var IW = 1376, IH = 768;                 // 画像の実寸
  var RED = [653, 389];                    // 赤ノード（画像px）
  var PINS = [
    [812,138],[649,180],[1043,203],[381,214],[544,215],[753,238],
    [905,276],[456,310],[1033,340],[261,532],[997,534],[512,633]
  ];
  var maxD = 0;
  var nodes = PINS.map(function (p) {
    var d = Math.hypot(p[0] - RED[0], p[1] - RED[1]);
    if (d > maxD) maxD = d;
    return { x: p[0], y: p[1], d: d, el: null };
  });

  function make(cls, delay) {
    var el = document.createElement('span');
    el.className = 'ln' + (cls ? ' ' + cls : '');
    if (delay != null) el.style.animationDelay = delay.toFixed(2) + 's';
    layer.appendChild(el);
    return el;
  }
  var redEl = make('red', 0);
  nodes.forEach(function (n) {
    n.el = make('', 0.9 + (n.d / maxD) * 3.4);   // 赤から遠いほど遅れて点灯
  });

  function place(el, x, y, base, scale) {
    var s = base * scale;
    el.style.width = s + 'px'; el.style.height = s + 'px';
    el.style.left = (x - s / 2) + 'px'; el.style.top = (y - s / 2) + 'px';
  }
  function layout() {
    var cw = art.clientWidth, ch = art.clientHeight;
    if (!cw || !ch) return;
    var scale = Math.max(cw / IW, ch / IH);
    var dw = IW * scale, dh = IH * scale;
    var pos = getComputedStyle(img).objectPosition.split(' ');
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1]) / 100;
    if (isNaN(px)) px = 0.5; if (isNaN(py)) py = 0.5;
    var ox = (cw - dw) * px, oy = (ch - dh) * py;
    place(redEl, ox + RED[0] * scale, oy + RED[1] * scale, 62, scale);
    nodes.forEach(function (n) {
      place(n.el, ox + n.x * scale, oy + n.y * scale, 40, scale);
    });
  }
  if (img.complete) layout(); else img.addEventListener('load', layout);
  window.addEventListener('resize', layout);
})();

/* ============================================================
   見出しテキストのモーション（2026-08-07 追加）
   参考 design-inc.co.jp の作法を移植。ただし同サイトの
   display:none→inline（＝1文字ずつ幅が増える）方式は採らず、
   文字の占有スペースは最初から確定させたまま opacity / clip-path
   だけで見せる。＝ 折り返し・行位置・見出しの高さは一切動かない。
   ============================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP = 100;   // 1文字あたり(ms)＝参考サイト design-inc.co.jp と同速
  var START = 320;  // 打ち始め(ms)

  /* ---------- MV見出し：タイプライター ---------- */
  var h1 = document.getElementById('hero-title');
  if (h1) typewriter(h1);

  function typewriter(el) {
    var full = el.textContent.replace(/\s+/g, ' ').trim();
    var chars = [];
    // 既存のマーカー帯（span::after）を持つ元のspanを目印付けしておく
    Array.prototype.forEach.call(el.children, function (n) {
      if (n.tagName === 'SPAN') n.classList.add('tw-mark');
    });
    // テキストノードだけを1文字ずつ span 化（<br> と マーカー用<span> の構造は保持）
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'tw-char';
            s.textContent = c;
            frag.appendChild(s);
            chars.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    })(el);

    // 支援技術には分割前の文言をそのまま読ませる（1文字ずつ読み上げる事故の回避）
    if (full && !el.getAttribute('aria-label')) el.setAttribute('aria-label', full);
    el.classList.add('tw-ready');
    if (!chars.length) return;

    if (reduced) {
      chars.forEach(function (c) { c.classList.add('tw-on'); });
      el.classList.add('tw-done');
      return;
    }

    var caret = document.createElement('i');
    caret.className = 'tw-caret';
    caret.setAttribute('aria-hidden', 'true');
    el.appendChild(caret);

    function moveCaret(ch) {
      var hb = el.getBoundingClientRect(), cb = ch.getBoundingClientRect();
      caret.style.left = (cb.right - hb.left) + 'px';
      caret.style.top = (cb.top - hb.top) + 'px';
    }

    var i = 0;
    function put() {
      var ch = chars[i++];
      ch.classList.add('tw-on');
      moveCaret(ch);
      if (i < chars.length) setTimeout(put, STEP);
      else setTimeout(function () {
        caret.classList.remove('tw-on');
        el.classList.add('tw-done');   // 打ち終わってからマーカーを左→右に引く
      }, 480);
    }
    setTimeout(function () { caret.classList.add('tw-on'); put(); }, START);
  }

  /* ---------- 下層ページFV見出し：2段ワイプ ---------- */
  var ph = document.querySelector('.page-hero');
  var pt = ph && ph.querySelector('h1');
  if (pt) {
    var main = document.createElement('span');
    main.className = 'tw-main';
    while (pt.firstChild) main.appendChild(pt.firstChild);

    var ghost = document.createElement('span');   // 先に現れる半調のレイヤー
    ghost.className = 'tw-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.innerHTML = main.innerHTML;

    var wrap = document.createElement('span');
    wrap.className = 'tw-wipe';
    wrap.appendChild(ghost);
    wrap.appendChild(main);
    pt.appendChild(wrap);
    pt.classList.add('tw-ready');

    if (reduced) {
      pt.classList.add('tw-go');
      ph.classList.add('tw-go');
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          pt.classList.add('tw-go');
          ph.classList.add('tw-go');
        });
      });
    }
  }
})();
