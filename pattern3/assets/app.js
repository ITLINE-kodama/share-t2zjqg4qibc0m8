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
            ctx.strokeStyle = 'rgba(30,42,74,' + (0.10 * (1 - d2 / 10000)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        var g = (i % 9 === 0);
        ctx.fillStyle = g ? 'rgba(184,137,62,.62)' : 'rgba(49,91,125,.38)';
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
