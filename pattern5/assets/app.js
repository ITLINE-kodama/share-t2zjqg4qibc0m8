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

  /* ---------- production forms / preview-safe fallback ---------- */
  var previewHost = location.protocol === 'file:' || location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' || /\.github\.io$/i.test(location.hostname);
  if (previewHost) document.documentElement.classList.add('preview-environment');

  document.querySelectorAll('form[data-live-form]').forEach(function (form) {
    var result = form.querySelector('.form-result');
    var started = form.querySelector('input[name="form_started"]');
    var submit = form.querySelector('[type="submit"]');
    var params = new URLSearchParams(location.search);
    if (started) started.value = String(Date.now());

    function showResult(html, isError) {
      if (!result) return;
      result.hidden = false;
      result.classList.toggle('is-error', !!isError);
      result.innerHTML = html;
      result.setAttribute('tabindex', '-1');
      result.focus();
      result.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }

    if (params.get('form') === 'sent') {
      showResult('<b>送信が完了しました。</b><br>事務局で内容を確認し、ご入力いただいたメールアドレスへご連絡します。', false);
      form.reset();
    } else if (params.get('form') === 'error') {
      showResult('<b>送信できませんでした。</b><br>時間をおいて再度お試しいただくか、事務局 <a href="mailto:info@trustedfor.ai">info@trustedfor.ai</a> へメールでご連絡ください。', true);
    }

    form.addEventListener('submit', function (e) {
      if (!form.reportValidity()) {
        e.preventDefault();
        return;
      }
      if (previewHost) {
        e.preventDefault();
        showResult('<b>確認用環境のため、送信は行われませんでした。</b><br>本公開サーバーでは事務局 <a href="mailto:info@trustedfor.ai">info@trustedfor.ai</a> 宛てに送信されます。', false);
        return;
      }
      if (submit) {
        submit.disabled = true;
        submit.textContent = '送信中…';
      }
    });
  });
})();

/* ---------- lower-page research index plate ---------- */
(function () {
  'use strict';
  var hero = document.querySelector('.page-hero');
  if (!hero || hero.querySelector('.subhero-plate')) return;
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var meta = {
    'about.html': ['01', 'ABOUT / PURPOSE'],
    'members.html': ['02', 'ABOUT / MEMBERS'],
    'rules.html': ['03', 'ABOUT / GOVERNANCE'],
    'knowledge-base.html': ['04', 'KNOWLEDGE / STRUCTURE'],
    'spec.html': ['05', 'KNOWLEDGE / SPECIFICATION'],
    'activity.html': ['06', 'ACTIVITY / ROADMAP'],
    'poc.html': ['07', 'ACTIVITY / FIELD TEST'],
    'news.html': ['08', 'INFORMATION / NEWS'],
    'news-detail.html': ['08A', 'INFORMATION / ARTICLE'],
    'join.html': ['09', 'CONTACT / PARTICIPATION'],
    'contact.html': ['10', 'CONTACT / INQUIRY'],
    'terms.html': ['11', 'POLICY / TERMS'],
    'privacy.html': ['12', 'POLICY / STATUS'],
    'sitemap.html': ['13', 'INDEX / SITE MAP']
  };
  var item = meta[file] || ['00', 'PUBLIC AI / RESEARCH'];
  var plate = document.createElement('div');
  plate.className = 'subhero-plate';
  plate.setAttribute('aria-hidden', 'true');
  plate.innerHTML = '<span class="plate-code">' + item[1] + '</span>' +
    '<span class="plate-axis a1"></span><span class="plate-axis a2"></span>' +
    '<span class="plate-axis a3"></span><span class="plate-axis a4"></span>' +
    '<span class="plate-node n1"></span><span class="plate-node n2"></span>' +
    '<span class="plate-node n3"></span><span class="plate-node n4"></span>' +
    '<span class="plate-node n5"></span><span class="plate-core"></span>' +
    '<span class="plate-caption">PUBLIC AI KNOWLEDGE<br>RESEARCH INDEX</span>' +
    '<span class="plate-no">' + item[0] + '</span>';
  hero.appendChild(plate);
})();

/* ============================================================
   Pattern 5 / CODEX × CLAUDE 追加レイヤー（パターン2のディレクションを移植）
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

})();
