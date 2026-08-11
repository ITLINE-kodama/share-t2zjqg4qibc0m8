/*!
 * 公共AIナレッジ研究会 ご確認用資料 — コメント欄
 * 株式会社ITLINE / 2026-08-10
 *
 * 使い方：確認用ページの </body> の直前に1行入れるだけ。
 *   <script src="comment/comments.js" data-thread="index" data-label="資料一覧" defer></script>
 *
 * data-thread … コメントを分ける単位（英数字）
 * data-label  … 管理用の資料名（日本語可・省略時は <title>）
 *
 * デザイン案ページを汚さないよう、右下のボタンからパネルを開く形にしている。
 */
(function () {
  'use strict';

  var SCRIPT = document.currentScript ||
    (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();

  // ------------------------------------------------------------------
  // 設定
  // ------------------------------------------------------------------
  // Apps Script のウェブアプリURL（プロジェクト「公共AIナレッジ研究会_資料コメント」/ 2026-08-10 デプロイ）
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzat8ImRRKXemKYprQqgtVkSVn6AVZRyJwIbLiMtQjdoX5Pk2L3F76S4dmd8u7ZlTB9/exec';

  // 添付ファイル機能のON/OFF。
  // バックエンド（Apps Script）側の不具合を調査中のため、いまはOFFにしている。
  // 解決したら true に戻す。
  var ENABLE_ATTACH = false;

  var THREAD = (SCRIPT.getAttribute('data-thread') || 'index').trim();
  var LABEL  = (SCRIPT.getAttribute('data-label') || document.title || '').trim().slice(0, 120);
  var BUTTON = (SCRIPT.getAttribute('data-button') || 'この資料にコメント').trim().slice(0, 20);

  if (ENDPOINT.indexOf('http') !== 0) {
    if (window.console) console.warn('[comments] ENDPOINT が未設定です');
    return;
  }

  var STORE_KEY = 'kokyoai_commenter';

  // ------------------------------------------------------------------
  // スタイル
  // ------------------------------------------------------------------
  var CSS = [
    '.kc-fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;',
    'padding:12px 18px;border:0;border-radius:999px;background:#1E3C90;color:#fff;cursor:pointer;',
    'font:600 14px/1 "Noto Sans JP",system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.22)}',
    '.kc-fab:hover{background:#16306F}',
    '.kc-fab .kc-n{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;',
    'padding:0 6px;border-radius:999px;background:#E3372E;font-size:11px;font-weight:700}',

    ':root{--kc-w:min(430px,34vw)}',
    '.kc-ov{position:fixed;inset:0;z-index:2147483001;background:rgba(20,22,28,.45);display:none}',
    '.kc-ov[data-open="1"]{display:block}',

    '.kc-pane{position:fixed;top:0;right:0;bottom:0;width:min(430px,100%);background:#fff;display:flex;flex-direction:column;',
    'box-shadow:-8px 0 30px rgba(0,0,0,.2);font:400 14px/1.8 "Noto Sans JP",system-ui,sans-serif;color:#221815}',

    /* 画面が広いときは「かぶせる」のではなく本文を左へ押し出して、資料とコメントを同時に見られるようにする */
    'body{transition:padding-right .18s ease}',
    'html.kc-dock body{padding-right:var(--kc-w)}',
    'html.kc-dock .kc-ov{background:transparent;pointer-events:none}',
    'html.kc-dock .kc-pane{pointer-events:auto;box-shadow:-2px 0 12px rgba(0,0,0,.10);border-left:1px solid #D8DDE6}',
    '.kc-fab[hidden]{display:none}',

    '.kc-hd{display:flex;align-items:flex-start;gap:12px;padding:16px 18px;border-bottom:1px solid #E3E6EC;border-top:4px solid #1E3C90}',
    '.kc-hd h2{margin:0;font-size:15px;font-weight:700;letter-spacing:-.01em}',
    '.kc-hd p{margin:3px 0 0;font-size:12px;color:#6B7280}',
    '.kc-x{margin-left:auto;border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#6B7280;padding:0 2px}',
    '.kc-x:hover{color:#221815}',

    '.kc-list{flex:1;overflow:auto;padding:14px 18px;background:#F7F8FA}',
    '.kc-empty{margin:24px 0;text-align:center;color:#8A93A2;font-size:13px}',
    '.kc-item{background:#fff;border:1px solid #E3E6EC;border-left:3px solid #1E3C90;padding:11px 13px;margin:0 0 10px}',
    '.kc-item .kc-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;margin-bottom:5px}',
    '.kc-item .kc-name{font-weight:700;font-size:13px}',
    '.kc-item .kc-org{font-size:11px;color:#6B7280}',
    '.kc-item .kc-at{margin-left:auto;font-size:11px;color:#9AA1AD;font-family:"Roboto Mono",monospace}',
    '.kc-item .kc-body{font-size:13.5px;white-space:pre-wrap;word-break:break-word;margin:0}',

    '.kc-form{border-top:1px solid #E3E6EC;padding:14px 18px 16px;background:#fff}',
    '.kc-row{display:flex;gap:8px;margin:0 0 8px}',
    '.kc-form label{display:block;font-size:11px;font-weight:700;color:#4B5568;margin:0 0 3px}',
    '.kc-form input,.kc-form textarea{width:100%;box-sizing:border-box;border:1px solid #C9CFD8;border-radius:3px;',
    'padding:8px 10px;font:400 13.5px/1.7 "Noto Sans JP",system-ui,sans-serif;color:#221815;background:#fff}',
    '.kc-form input:focus,.kc-form textarea:focus{outline:2px solid #1E3C90;outline-offset:-1px;border-color:#1E3C90}',
    '.kc-form textarea{resize:vertical;min-height:86px}',
    '.kc-hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden}',
    '.kc-send{width:100%;margin-top:10px;padding:11px;border:0;border-radius:3px;background:#1E3C90;color:#fff;cursor:pointer;',
    'font:700 14px/1 "Noto Sans JP",system-ui,sans-serif}',
    '.kc-send:hover{background:#16306F}',
    '.kc-send[disabled]{background:#9AA1AD;cursor:default}',
    '.kc-att{margin-top:8px}',
    '.kc-att input[type=file]{padding:6px 8px;font-size:12px;background:#FAFBFD;cursor:pointer}',
    '.kc-att-help{margin:4px 0 0;font-size:11px;line-height:1.6;color:#8A93A2}',
    '.kc-att-list{margin:6px 0 0;padding:0;list-style:none}',
    '.kc-att-list li{display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 8px;background:#F2F5FA;',
    'border:1px solid #DDE3EC;border-radius:3px;margin-bottom:4px}',
    '.kc-att-list li span.n{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.kc-att-list li span.s{color:#8A93A2;font-family:"Roboto Mono",monospace;font-size:11px}',
    '.kc-att-list li.ng{background:#FDF2F1;border-color:#F0C9C6;color:#C22A22}',
    '.kc-item .kc-files{margin:7px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px}',
    '.kc-item .kc-files a{display:inline-flex;align-items:center;gap:5px;max-width:100%;font-size:12px;',
    'padding:4px 9px;background:#F2F5FA;border:1px solid #DDE3EC;border-radius:3px;color:#1E3C90;text-decoration:none}',
    '.kc-item .kc-files a:hover{background:#E7EDF7;border-color:#1E3C90}',
    '.kc-msg{margin:8px 0 0;font-size:12px;min-height:1em}',
    '.kc-msg.err{color:#C22A22}',
    '.kc-msg.ok{color:#1E7A46}',

    '@media print{.kc-fab,.kc-ov{display:none!important}html.kc-dock body{padding-right:0!important}}',
    '@media (max-width:520px){.kc-fab{right:12px;bottom:12px;padding:11px 15px;font-size:13px}}'
  ].join('');

  // ------------------------------------------------------------------
  // 組み立て
  // ------------------------------------------------------------------
  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    function p(n) { return ('0' + n).slice(-2); }
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var fab = el('<button class="kc-fab" type="button" aria-haspopup="dialog">' +
               '<span aria-hidden="true">💬</span><span>' + esc(BUTTON) + '</span>' +
               '<span class="kc-n" hidden>0</span></button>');

  var ov = el(
    '<div class="kc-ov" role="presentation">' +
      '<div class="kc-pane" role="dialog" aria-modal="true" aria-label="この資料へのコメント">' +
        '<div class="kc-hd">' +
          '<div><h2>この資料へのコメント</h2><p class="kc-label"></p></div>' +
          '<button class="kc-x" type="button" aria-label="閉じる">×</button>' +
        '</div>' +
        '<div class="kc-list" tabindex="0"><p class="kc-empty">読み込んでいます…</p></div>' +
        '<form class="kc-form" novalidate>' +
          '<div class="kc-row">' +
            '<div style="flex:1"><label for="kc-name">お名前 <span style="color:#C22A22">*</span></label>' +
              '<input id="kc-name" name="name" maxlength="60" autocomplete="name" required></div>' +
            '<div style="flex:1.3"><label for="kc-org">ご所属</label>' +
              '<input id="kc-org" name="org" maxlength="120" autocomplete="organization"></div>' +
          '</div>' +
          '<label for="kc-body">コメント <span style="color:#C22A22">*</span></label>' +
          '<textarea id="kc-body" name="body" maxlength="2000" required></textarea>' +
          '<div class="kc-att">' +
            '<label for="kc-file">添付ファイル（任意）</label>' +
            '<input id="kc-file" name="files" type="file" multiple ' +
              'accept=".xlsx,.xls,.xlsm,.docx,.doc,.pdf,.png,.jpg,.jpeg,.gif,.zip,.csv,.txt,.pptx,.ppt">' +
            '<p class="kc-att-help">Excel・Word・PDF・画像・ZIP／1ファイル10MBまで・3ファイルまで。' +
              'フォルダはZIPに圧縮してから添付してください。</p>' +
            '<ul class="kc-att-list"></ul>' +
          '</div>' +
          '<div style="margin-top:8px"><label for="kc-pass">合言葉 <span style="color:#C22A22">*</span></label>' +
            '<input id="kc-pass" name="pass" maxlength="100" autocomplete="off" required></div>' +
          '<div class="kc-hp" aria-hidden="true"><label>ここは入力しないでください' +
            '<input name="hp" tabindex="-1" autocomplete="off"></label></div>' +
          '<button class="kc-send" type="submit">コメントを送信</button>' +
          '<p class="kc-msg" role="status"></p>' +
        '</form>' +
      '</div>' +
    '</div>');

  document.body.appendChild(fab);
  document.body.appendChild(ov);

  var pane  = ov.querySelector('.kc-pane');
  var list  = ov.querySelector('.kc-list');
  var form  = ov.querySelector('.kc-form');
  var msg   = ov.querySelector('.kc-msg');
  var count = fab.querySelector('.kc-n');
  ov.querySelector('.kc-label').textContent = LABEL;

  // 前回の記入者情報を復元する
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (saved.name) form.name.value = saved.name;
    if (saved.org)  form.org.value  = saved.org;
    if (saved.pass) form.pass.value = saved.pass;
  } catch (e) {}

  // ------------------------------------------------------------------
  // 添付
  // ------------------------------------------------------------------
  var MAX_FILE_BYTES  = 10 * 1024 * 1024;
  var MAX_FILE_COUNT  = 3;
  var MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  var ALLOWED_EXT = ['xlsx', 'xls', 'xlsm', 'docx', 'doc', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'csv', 'txt', 'pptx', 'ppt'];

  var fileInput = ov.querySelector('#kc-file');
  var attList   = ov.querySelector('.kc-att-list');

  // OFFのあいだは添付欄ごと隠す（送信処理も files を積まない）
  if (!ENABLE_ATTACH) {
    var attBox = ov.querySelector('.kc-att');
    if (attBox) attBox.style.display = 'none';
  }

  function fmtSize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function extOf(name) {
    var m = String(name || '').match(/\.([A-Za-z0-9]+)$/);
    return m ? m[1].toLowerCase() : '';
  }

  /** 選択されたファイルを検証して一覧に出す。問題があればメッセージを返す。 */
  function checkFiles() {
    var files = fileInput.files ? [].slice.call(fileInput.files) : [];
    attList.innerHTML = '';
    if (!files.length) return '';

    var err = '';
    if (files.length > MAX_FILE_COUNT) err = '添付は' + MAX_FILE_COUNT + 'ファイルまでです。';

    var total = 0;
    files.forEach(function (f) {
      total += f.size;
      var bad = '';
      if (ALLOWED_EXT.indexOf(extOf(f.name)) === -1) bad = 'この形式は添付できません';
      else if (f.size > MAX_FILE_BYTES)              bad = '10MBを超えています';
      if (bad && !err) err = '「' + f.name + '」' + bad + '。';

      var li = document.createElement('li');
      if (bad) li.className = 'ng';
      li.innerHTML = '<span aria-hidden="true">📎</span>' +
                     '<span class="n">' + esc(f.name) + '</span>' +
                     '<span class="s">' + (bad ? esc(bad) : fmtSize(f.size)) + '</span>';
      attList.appendChild(li);
    });

    if (!err && total > MAX_TOTAL_BYTES) err = '添付の合計が20MBを超えています。';
    return err;
  }

  fileInput.addEventListener('change', function () {
    var err = checkFiles();
    msg.className = err ? 'kc-msg err' : 'kc-msg';
    msg.textContent = err;
  });

  /** File を base64 に変換する */
  function readAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        resolve({ name: file.name, data: s.slice(s.indexOf(',') + 1) });
      };
      fr.onerror = function () { reject(new Error('「' + file.name + '」を読み込めませんでした。')); };
      fr.readAsDataURL(file);
    });
  }

  /** コメントに付いている添付のリンクを組み立てる */
  function attsHtml(atts) {
    if (!atts || !atts.length) return '';
    return '<ul class="kc-files">' + atts.map(function (a) {
      return '<li><a href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
               '<span aria-hidden="true">📎</span>' + esc(a.name) +
             '</a></li>';
    }).join('') + '</ul>';
  }

  // ------------------------------------------------------------------
  // 表示
  // ------------------------------------------------------------------
  function render(items) {
    if (!items || !items.length) {
      list.innerHTML = '<p class="kc-empty">まだコメントはありません。<br>最初のコメントをお寄せください。</p>';
      count.hidden = true;
      return;
    }
    list.innerHTML = items.map(function (c) {
      return '<div class="kc-item">' +
               '<div class="kc-meta">' +
                 '<span class="kc-name">' + esc(c.name) + '</span>' +
                 (c.org ? '<span class="kc-org">' + esc(c.org) + '</span>' : '') +
                 '<span class="kc-at">' + esc(fmtDate(c.at)) + '</span>' +
               '</div>' +
               '<p class="kc-body">' + esc(c.body) + '</p>' +
               attsHtml(c.atts) +
             '</div>';
    }).join('');
    count.hidden = false;
    count.textContent = items.length;
  }

  var loaded = false;
  var cached = [];

  function load() {
    return fetch(ENDPOINT + '?thread=' + encodeURIComponent(THREAD), { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.error || '読み込みに失敗しました');
        cached = (d.items || []).slice();
        render(cached);
        loaded = true;
      })
      .catch(function () {
        list.innerHTML = '<p class="kc-empty">コメントを読み込めませんでした。<br>時間をおいて開き直してください。</p>';
      });
  }

  // 件数バッジのために、開く前に一度だけ静かに読み込む
  load();

  // ------------------------------------------------------------------
  // 開閉
  // ------------------------------------------------------------------
  var lastFocus = null;
  var OPEN_KEY  = 'kokyoai_comments_open';
  var DOCK_MIN  = 1080;   // これ以上の幅なら「本文を押し出して並べる」表示にする

  function isOpen() { return ov.getAttribute('data-open') === '1'; }
  function canDock() { return window.innerWidth >= DOCK_MIN; }

  function applyMode() {
    var dock = isOpen() && canDock();
    document.documentElement.classList.toggle('kc-dock', dock);
    // 並べて表示のときは本文をスクロールできる必要があるので、かぶせるときだけロックする。
    document.body.style.overflow = (isOpen() && !dock) ? 'hidden' : '';
  }

  function open(focus) {
    if (focus) lastFocus = document.activeElement;
    ov.setAttribute('data-open', '1');
    fab.hidden = true;
    applyMode();
    if (!loaded) load();
    try { localStorage.setItem(OPEN_KEY, '1'); } catch (e) {}
    if (focus) {
      setTimeout(function () { (form.name.value ? form.body : form.name).focus(); }, 40);
    }
  }

  function close() {
    ov.removeAttribute('data-open');
    fab.hidden = false;
    applyMode();
    try { localStorage.setItem(OPEN_KEY, '0'); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  fab.addEventListener('click', function () { open(true); });
  ov.querySelector('.kc-x').addEventListener('click', close);
  // かぶせて表示しているときだけ、外側をクリックで閉じる（並べて表示中は背景を触れないようにしてある）
  ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });
  window.addEventListener('resize', function () { if (isOpen()) applyMode(); });

  // 既定は「開いた状態」。閉じた場合はその選択を次回も引き継ぐ。
  // 画面が狭いときは本文を覆ってしまうので自動では開かない。
  var pref = null;
  try { pref = localStorage.getItem(OPEN_KEY); } catch (e) {}
  if (pref !== '0' && canDock()) open(false);

  // ------------------------------------------------------------------
  // 送信
  // ------------------------------------------------------------------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'kc-msg';
    msg.textContent = '';

    var payload = {
      thread: THREAD,
      label:  LABEL,
      name:   form.name.value.trim(),
      org:    form.org.value.trim(),
      body:   form.body.value.trim(),
      pass:   form.pass.value.trim(),
      hp:     form.hp.value
    };

    if (!payload.name) { msg.className = 'kc-msg err'; msg.textContent = 'お名前をご入力ください。'; form.name.focus(); return; }
    if (!payload.body) { msg.className = 'kc-msg err'; msg.textContent = 'コメントをご入力ください。'; form.body.focus(); return; }
    if (!payload.pass) { msg.className = 'kc-msg err'; msg.textContent = '合言葉をご入力ください。'; form.pass.focus(); return; }

    var fileErr = ENABLE_ATTACH ? checkFiles() : '';
    if (fileErr) { msg.className = 'kc-msg err'; msg.textContent = fileErr; return; }

    var picked = (ENABLE_ATTACH && fileInput.files) ? [].slice.call(fileInput.files) : [];

    var btn = form.querySelector('.kc-send');
    btn.disabled = true;
    btn.textContent = picked.length ? 'アップロードしています…' : '送信しています…';

    Promise.all(picked.map(readAsBase64))
      .then(function (files) {
        payload.files = files;
        // Content-Type を text/plain にして、CORSのプリフライトを避ける
        return fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.error || '送信に失敗しました');

        try {
          localStorage.setItem(STORE_KEY, JSON.stringify({
            name: payload.name, org: payload.org, pass: payload.pass
          }));
        } catch (e2) {}

        cached.push(d.item);
        render(cached);
        form.body.value = '';
        fileInput.value = '';
        attList.innerHTML = '';
        msg.className = 'kc-msg ok';
        msg.textContent = (d.item && d.item.atts && d.item.atts.length)
          ? 'ありがとうございました。コメントと添付ファイルを受け付けました。'
          : 'ありがとうございました。コメントを受け付けました。';
        list.scrollTop = list.scrollHeight;
      })
      .catch(function (err) {
        msg.className = 'kc-msg err';
        msg.textContent = err.message || '送信に失敗しました。';
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = 'コメントを送信';
      });
  });
})();
