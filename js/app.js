/* 世界伝統色辞典 — アプリ本体 */
(function () {
  'use strict';

  const CU = window.ColorUtils;
  const SEKAI = window.SEKAI || {};
  // 埋め込み先の制約に合わせて機能を切り替える設定(index.html より前に window.SEKAI_CONFIG を定義して上書きする)
  //   hashState: 絞り込み条件・開いている色をURLの # に保存/復元する  fileSave: パレットをファイルとして保存するボタンを出す
  const CONFIG = Object.assign({ hashState: true, fileSave: true }, window.SEKAI_CONFIG || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  /* ───────── 定義 ───────── */
  const REGIONS = [
    { id: 'jp', label: '日本', en: 'Japan', lang: 'ja', color: '#c13b48', isNew: false, kanaLabel: '読み', romanLabel: 'ローマ字' },
    { id: 'eu', label: '欧州', en: 'Europe', lang: 'ja', color: '#3b57b5', isNew: false, kanaLabel: '', romanLabel: '原語・英語表記' },
    { id: 'cn', label: '中国', en: 'China', lang: 'zh-Hant', color: '#d0a02b', isNew: true, kanaLabel: '日本語読み', romanLabel: 'ピンイン' },
    { id: 'in', label: 'インド', en: 'India', lang: 'hi', color: '#e97f1e', isNew: true, kanaLabel: 'カナ読み', romanLabel: '翻字' },
    { id: 'ir', label: 'ペルシャ', en: 'Persia', lang: 'fa', dir: 'rtl', color: '#1ea8a1', isNew: true, kanaLabel: 'カナ読み', romanLabel: '翻字' }
  ];
  const FAMILIES = [
    { id: 'pink', label: '桃系', dot: '#f2a1b8' }, { id: 'red', label: '赤系', dot: '#c8372d' },
    { id: 'orange', label: '橙系', dot: '#e9831c' }, { id: 'yellow', label: '黄系', dot: '#f0c419' },
    { id: 'green', label: '緑系', dot: '#4fa14b' }, { id: 'blue', label: '青系', dot: '#2f6db5' },
    { id: 'purple', label: '紫系', dot: '#7b4fa2' }, { id: 'brown', label: '茶系', dot: '#7a5230' },
    { id: 'mono', label: '白黒系', dot: 'linear-gradient(135deg,#fff 0 50%,#222 50% 100%)' }
  ];
  const TAGS = [
    { id: 'f', label: '花・草木' }, { id: 'm', label: '鉱物・顔料' }, { id: 'd', label: '染料・織物' }, { id: 'a', label: '動物・鳥' },
    { id: 'n', label: '空・水・自然' }, { id: 't', label: '食・香辛料' }, { id: 'g', label: '宝石・金属' }, { id: 'c', label: '文化・儀礼' }
  ];
  const SORT_LABEL = { order: '掲載順', name: '名前順', hue: '色相順', light: '明度順', chroma: '彩度順' };
  const RBY = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const FBY = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));
  const TBY = Object.fromEntries(TAGS.map((t) => [t.id, t]));
  const ICON_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path stroke-linejoin="round" d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.7 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.3 0 5.4 3.1 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>';

  /* ───────── 保存(失敗しても動くようにする) ───────── */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 保存できない環境では無視 */ } }
  };

  /* ───────── データ構築 ───────── */
  const ALL = [];
  const byId = {};
  REGIONS.forEach((r) => {
    (SEKAI[r.id] || []).forEach((a, i) => {
      const hex = a[3].toUpperCase();
      const rgb = CU.hexToRgb(hex);
      const lab = CU.rgbToLab(rgb[0], rgb[1], rgb[2]);
      const c = {
        id: r.id + '-' + String(i + 1).padStart(3, '0'),
        region: r.id, order: ALL.length,
        name: a[0], kana: a[1], roman: a[2], hex, note: a[4], tag: a[5],
        rgb, lab, hsl: CU.rgbToHsl(rgb[0], rgb[1], rgb[2]),
        family: CU.classify(hex), text: CU.readableText(rgb),
        chroma: Math.hypot(lab[1], lab[2]),
        sortKey: CU.normalize(a[1] || a[0]),
        key: CU.normalize([a[0], a[1], a[2], hex, a[4], r.label, r.en, FBY[CU.classify(hex)].label, TBY[a[5]].label].join(' '))
      };
      ALL.push(c); byId[c.id] = c;
    });
  });

  /* ───────── 状態 ───────── */
  const DEFAULTS = { region: 'all', family: 'all', tag: 'all', q: '', sort: 'order', view: 'grid' };
  const state = Object.assign({}, DEFAULTS);
  let tokens = [];
  let visible = [];
  let selectedId = null;
  let favList = [];
  try { favList = (JSON.parse(store.get('sekai-iro:v1') || '[]') || []).filter((id) => byId[id]); } catch (e) { favList = []; }
  const isFav = (id) => favList.indexOf(id) >= 0;

  /* ───────── ユーティリティ ───────── */
  const hueKey = (c) => (c.family === 'mono' ? 1000 + (100 - c.lab[0]) : (c.hsl[0] + 20) % 360);
  const SORTS = {
    order: (a, b) => a.order - b.order,
    name: (a, b) => a.sortKey.localeCompare(b.sortKey, 'ja') || a.order - b.order,
    hue: (a, b) => hueKey(a) - hueKey(b) || a.order - b.order,
    light: (a, b) => b.lab[0] - a.lab[0] || a.order - b.order,
    chroma: (a, b) => b.chroma - a.chroma || a.order - b.order
  };
  function nameAttrs(c) { const r = RBY[c.region]; return 'lang="' + r.lang + '"' + (r.dir ? ' dir="' + r.dir + '"' : ''); }
  function matches(c, skip) {
    if (skip !== 'region' && state.region !== 'all' && c.region !== state.region) return false;
    if (skip !== 'family' && state.family !== 'all' && c.family !== state.family) return false;
    if (skip !== 'tag' && state.tag !== 'all' && c.tag !== state.tag) return false;
    for (let i = 0; i < tokens.length; i++) if (c.key.indexOf(tokens[i]) < 0) return false;
    return true;
  }
  function nearestBy(lab, filter, n, excludeId) {
    const arr = [];
    for (let i = 0; i < ALL.length; i++) {
      const c = ALL[i];
      if (c.id === excludeId || (filter && !filter(c))) continue;
      arr.push({ c, d: CU.deltaE(lab, c.lab) });
    }
    arr.sort((a, b) => a.d - b.d);
    return arr.slice(0, n);
  }
  function closeness(d) {
    if (d < 2) return ['ほぼ同じ', true];
    if (d < 5) return ['とても近い', true];
    if (d < 10) return ['近い', false];
    if (d < 18) return ['やや近い', false];
    return ['離れている', false];
  }
  function sampleStrip(list, n) {
    const pool = list.filter((c) => c.family !== 'mono' && c.lab[0] > 25 && c.lab[0] < 88 && c.chroma > 22).sort((a, b) => hueKey(a) - hueKey(b));
    const out = [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool[Math.floor((i + 0.5) * pool.length / n)]);
    return out;
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }
  function copyText(text, msg) {
    const done = () => toast(msg || 'コピーしました');
    const fallback = () => {
      // モーダルダイアログ表示中は、その外の要素に触れない(inert)ため、開いているダイアログの中に一時的な入力欄を作る
      const host = $$('dialog').find((d) => d.open) || document.body;
      const prev = document.activeElement;
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      host.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); if (prev && typeof prev.focus === 'function') prev.focus();
      if (ok) done(); else toast('コピーできませんでした');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  /* ───────── URLハッシュ ───────── */
  function writeHash() {
    if (!CONFIG.hashState) return;
    const p = [];
    if (state.region !== 'all') p.push('r=' + state.region);
    if (state.family !== 'all') p.push('f=' + state.family);
    if (state.tag !== 'all') p.push('t=' + state.tag);
    if (state.q) p.push('q=' + encodeURIComponent(state.q));
    if (state.sort !== 'order') p.push('s=' + state.sort);
    if (state.view !== 'grid') p.push('v=' + state.view);
    if (selectedId) p.push('c=' + selectedId);
    const h = p.length ? '#' + p.join('&') : '';
    if (location.hash !== h) { try { history.replaceState(null, '', location.pathname + location.search + h); } catch (e) { /* file:// 等では無視 */ } }
  }
  function readHash() {
    if (!CONFIG.hashState) return;
    location.hash.replace(/^#/, '').split('&').forEach((kv) => {
      const i = kv.indexOf('='); if (i < 0) return;
      const k = kv.slice(0, i); let v = kv.slice(i + 1);
      try { v = decodeURIComponent(v); } catch (e) { return; }
      if (k === 'r' && (v === 'all' || RBY[v])) state.region = v;
      else if (k === 'f' && FBY[v]) state.family = v;
      else if (k === 't' && TBY[v]) state.tag = v;
      else if (k === 'q') state.q = v.slice(0, 80);
      else if (k === 's' && SORTS[v]) state.sort = v;
      else if (k === 'v' && (v === 'grid' || v === 'list' || v === 'map')) state.view = v;
      else if (k === 'c' && byId[v]) selectedId = v;
    });
  }

  /* ───────── 地域ボタン / チップ ───────── */
  function buildRegions() {
    const strip = (list) => '<span class="rg-strip">' + sampleStrip(list, 6).map((c) => '<i style="background:' + c.hex + '"></i>').join('') + '</span>';
    const items = [{ id: 'all', label: 'すべて', en: 'All regions', color: '#6b5f52', list: ALL }]
      .concat(REGIONS.map((r) => Object.assign({}, r, { list: ALL.filter((c) => c.region === r.id) })));
    $('#regions').innerHTML = items.map((r) =>
      '<button type="button" class="region" data-region="' + r.id + '" aria-pressed="false" style="--rc:' + r.color + '">' +
      '<span class="rg-top"><span class="rg-name">' + r.label + '</span>' + (r.isNew ? '<span class="rg-new">追加</span>' : '') + '</span>' +
      '<span class="rg-en">' + r.en + '</span>' + strip(r.list) + '<span class="rg-count"></span></button>').join('');
  }
  function buildChips() {
    const mk = (attr, id, label, dot) => '<button type="button" class="chip" data-' + attr + '="' + id + '" aria-pressed="false">' + (dot ? '<i style="background:' + dot + '"></i>' : '') + label + '<em></em></button>';
    $('#family-chips').innerHTML = mk('family', 'all', 'すべて') + FAMILIES.map((f) => mk('family', f.id, f.label, f.dot)).join('');
    $('#tag-chips').innerHTML = mk('tag', 'all', 'すべて') + TAGS.map((t) => mk('tag', t.id, t.label)).join('');
  }
  function refreshControls() {
    const base = ALL;
    const count = (skip, pred) => { let n = 0; for (let i = 0; i < base.length; i++) { if (matches(base[i], skip) && pred(base[i])) n++; } return n; };
    $$('.region').forEach((b) => {
      const id = b.dataset.region; b.setAttribute('aria-pressed', String(state.region === id));
      $('.rg-count', b).textContent = count('region', (c) => id === 'all' || c.region === id) + ' 色';
    });
    $$('#family-chips .chip').forEach((b) => {
      const id = b.dataset.family; const n = count('family', (c) => id === 'all' || c.family === id);
      b.setAttribute('aria-pressed', String(state.family === id)); b.dataset.zero = String(n === 0); $('em', b).textContent = n;
    });
    $$('#tag-chips .chip').forEach((b) => {
      const id = b.dataset.tag; const n = count('tag', (c) => id === 'all' || c.tag === id);
      b.setAttribute('aria-pressed', String(state.tag === id)); b.dataset.zero = String(n === 0); $('em', b).textContent = n;
    });
    $$('#view-seg button').forEach((b) => b.setAttribute('aria-pressed', String(state.view === b.dataset.view)));
    $('#sort').value = state.sort;
    if ($('#q').value !== state.q) $('#q').value = state.q;
  }

  /* ───────── 描画 ───────── */
  function cardHTML(c) {
    const r = RBY[c.region], fav = isFav(c.id);
    return '<li class="card" style="--c:' + c.hex + ';--t:' + c.text + '">' +
      '<button type="button" class="card-main" data-open="' + c.id + '" aria-label="' + esc(c.name + '、' + c.roman + '、' + r.label + '、' + c.hex) + '">' +
      '<span class="sw"><span class="sw-region">' + r.label + '</span><span class="sw-hex">' + c.hex + '</span></span>' +
      '<span class="info"><span class="nm" ' + nameAttrs(c) + '>' + esc(c.name) + '</span>' +
      (c.kana ? '<span class="rd">' + esc(c.kana) + '</span>' : '') + '<span class="rm">' + esc(c.roman) + '</span></span></button>' +
      '<button type="button" class="fav" data-fav="' + c.id + '" aria-pressed="' + fav + '" aria-label="' + esc(c.name) + 'をマイパレットに' + (fav ? 'から外す' : '追加') + '">' + ICON_HEART + '</button></li>';
  }
  function update() {
    tokens = state.q.split(/\s+/).map(CU.normalize).filter(Boolean);
    visible = ALL.filter((c) => matches(c)).sort(SORTS[state.sort]);
    refreshControls();

    const filtered = state.region !== 'all' || state.family !== 'all' || state.tag !== 'all' || !!state.q;
    const parts = [];
    if (state.region !== 'all') parts.push(RBY[state.region].label);
    if (state.family !== 'all') parts.push(FBY[state.family].label);
    if (state.tag !== 'all') parts.push(TBY[state.tag].label);
    if (state.q) parts.push('「' + esc(state.q) + '」');
    $('#count').innerHTML = (parts.length ? parts.join(' · ') + ' — ' : '') + '<b>' + visible.length + '</b> 色' + (state.sort !== 'order' ? '（' + SORT_LABEL[state.sort] + '）' : '');
    $('#reset').hidden = !filtered;

    const grid = $('#grid'), mapWrap = $('#map-wrap'), empty = $('#empty');
    empty.hidden = visible.length > 0;
    if (state.view === 'map') {
      grid.hidden = true; mapWrap.hidden = visible.length === 0; if (visible.length) drawMap();
    } else {
      mapWrap.hidden = true; grid.hidden = visible.length === 0;
      grid.classList.toggle('list', state.view === 'list');
      grid.innerHTML = visible.map(cardHTML).join('');
    }
    writeHash();
  }
  function setState(patch) { Object.assign(state, patch); update(); }
  function resetAll() { Object.assign(state, DEFAULTS); update(); }

  /* ───────── 分布図 ───────── */
  let mapPts = [], mapHover = null;
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function drawMap() {
    const wrap = $('#map-wrap'), cv = $('#map');
    const W = Math.max(280, wrap.clientWidth - 24), H = Math.max(360, Math.min(620, Math.round(W * 0.56)));
    const dpr = window.devicePixelRatio || 1;
    cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const m = { l: 30, r: 8, t: 10, b: 40 }, neutralW = Math.min(78, W * 0.1);
    const x0 = m.l, x1 = W - m.r, y0 = m.t, y1 = H - m.b, hx0 = x0 + neutralW + 8;
    const line = cssVar('--line'), muted = cssVar('--muted'), ink = cssVar('--ink');

    g.font = '11px ' + cssVar('--sans'); g.textBaseline = 'middle'; g.lineWidth = 1;
    for (let L = 0; L <= 100; L += 25) {
      const y = y0 + (1 - L / 100) * (y1 - y0);
      g.strokeStyle = line; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.fillStyle = muted; g.textAlign = 'right'; g.fillText(L === 100 ? '明' : L === 0 ? '暗' : String(L), x0 - 6, y);
    }
    g.strokeStyle = line; g.beginPath(); g.moveTo(hx0 - 4, y0); g.lineTo(hx0 - 4, y1); g.stroke();
    // 色相リボン
    const rib = g.createLinearGradient(hx0, 0, x1, 0);
    for (let i = 0; i <= 12; i++) rib.addColorStop(i / 12, 'hsl(' + (((i / 12) * 360 - 20 + 360) % 360) + ',72%,55%)');
    g.fillStyle = rib; g.fillRect(hx0, y1 + 8, x1 - hx0, 7);
    g.fillStyle = muted; g.textAlign = 'center';
    [['赤', 0], ['橙', 32], ['黄', 55], ['緑', 125], ['青', 215], ['紫', 280], ['桃', 335]].forEach((t) => {
      g.fillText(t[0], hx0 + (((t[1] + 20) % 360) / 360) * (x1 - hx0), y1 + 27);
    });
    g.textAlign = 'center'; g.fillText('無彩色', x0 + neutralW / 2, y1 + 27);

    const byRegion = state.region === 'all';
    mapPts = visible.map((c) => {
      let x;
      const j = ((c.order * 2654435761) % 1000) / 1000;
      if (c.family === 'mono') x = x0 + 8 + j * (neutralW - 12);
      else x = hx0 + (((c.hsl[0] + 20) % 360) / 360) * (x1 - hx0 - 6) + (j - 0.5) * 8;
      return { x, y: y0 + (1 - c.lab[0] / 100) * (y1 - y0), c };
    });
    mapPts.forEach((p) => {
      g.beginPath(); g.arc(p.x, p.y, 6, 0, Math.PI * 2); g.fillStyle = p.c.hex; g.fill();
      g.lineWidth = byRegion ? 2 : 1; g.strokeStyle = byRegion ? RBY[p.c.region].color : 'rgba(0,0,0,.28)'; g.stroke();
    });
    if (mapHover) { g.beginPath(); g.arc(mapHover.x, mapHover.y, 9, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = ink; g.stroke(); g.beginPath(); g.arc(mapHover.x, mapHover.y, 6, 0, Math.PI * 2); g.fillStyle = mapHover.c.hex; g.fill(); }
  }
  function mapPick(e, radius) {
    const cv = $('#map'), rc = cv.getBoundingClientRect();
    const x = e.clientX - rc.left, y = e.clientY - rc.top; let best = null, bd = radius * radius;
    for (let i = 0; i < mapPts.length; i++) { const dx = mapPts[i].x - x, dy = mapPts[i].y - y, d = dx * dx + dy * dy; if (d <= bd) { bd = d; best = mapPts[i]; } }
    return best;
  }
  function initMap() {
    const cv = $('#map'), tip = $('#map-tip');
    cv.addEventListener('mousemove', (e) => {
      const p = mapPick(e, 11);
      if ((p && mapHover && p.c.id === mapHover.c.id) || (!p && !mapHover)) return;
      mapHover = p; drawMap();
      if (!p) { tip.hidden = true; cv.style.cursor = 'crosshair'; return; }
      const r = RBY[p.c.region];
      tip.innerHTML = '<i style="background:' + p.c.hex + '"></i><b ' + nameAttrs(p.c) + '>' + esc(p.c.name) + '</b> <span>' + esc(p.c.roman) + '</span><br>' + r.label + ' · ' + p.c.hex;
      tip.hidden = false; cv.style.cursor = 'pointer';
      const wr = $('#map-wrap').getBoundingClientRect(), cr = cv.getBoundingClientRect();
      let left = cr.left - wr.left + p.x; left = Math.max(70, Math.min(wr.width - 70, left));
      tip.style.left = left + 'px'; tip.style.top = (cr.top - wr.top + p.y) + 'px';
    });
    cv.addEventListener('mouseleave', () => { if (mapHover) { mapHover = null; drawMap(); } tip.hidden = true; });
    cv.addEventListener('click', (e) => { const p = mapPick(e, 14); if (p) openDetail(p.c.id); });
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (state.view === 'map' && visible.length) drawMap(); }, 120); });
  }

  /* ───────── マイパレット ───────── */
  function saveFavs() { store.set('sekai-iro:v1', JSON.stringify(favList)); $('#pal-count').textContent = favList.length ? String(favList.length) : ''; }
  function toggleFav(id) {
    const i = favList.indexOf(id);
    if (i >= 0) favList.splice(i, 1); else favList.push(id);
    saveFavs();
    const on = isFav(id), c = byId[id];
    $$('[data-fav="' + id + '"]').forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      if (b.classList.contains('fav')) b.setAttribute('aria-label', c.name + 'をマイパレットに' + (on ? 'から外す' : '追加'));
    });
    toast(on ? '「' + c.name + '」をマイパレットに追加しました' : '「' + c.name + '」をマイパレットから外しました');
    if ($('#dlg-palette').open) renderPalette();
  }
  let palFmt = 'css';
  function paletteText(fmt) {
    const list = favList.map((id) => byId[id]);
    if (fmt === 'hex') return list.map((c) => c.hex).join(', ');
    if (fmt === 'json') {
      return JSON.stringify(list.map((c) => ({ id: c.id, name: c.name, reading: c.kana || undefined, roman: c.roman, region: RBY[c.region].label, hex: c.hex, rgb: c.rgb })), null, 2);
    }
    const used = {};
    return ':root {\n' + list.map((c) => {
      let n = c.region + '-' + (CU.slug(c.roman) || c.id); if (used[n]) n += '-' + c.id.split('-')[1]; used[n] = 1;
      return '  --' + n + ': ' + c.hex + '; /* ' + c.name + ' */';
    }).join('\n') + '\n}\n';
  }
  function renderPalette() {
    const body = $('#p-body');
    if (!favList.length) {
      body.innerHTML = '<p class="pal-empty">まだ色がありません。<br>カードのハートや、詳細の「マイパレット」ボタンで色を集めましょう。</p>';
      return;
    }
    const list = favList.map((id) => byId[id]);
    body.innerHTML =
      '<div class="pal-strip" aria-hidden="true">' + list.map((c) => '<i style="background:' + c.hex + '"></i>').join('') + '</div>' +
      '<div class="pal-list">' + list.map((c) => '<div class="pal-row" style="--c:' + c.hex + '"><span class="mini-sw"></span>' +
        '<button type="button" class="grow" data-open="' + c.id + '"><b ' + nameAttrs(c) + '>' + esc(c.name) + '</b><small>' + RBY[c.region].label + ' · ' + c.hex + '</small></button>' +
        '<button type="button" class="x" data-fav="' + c.id + '" aria-label="' + esc(c.name) + 'を外す">✕</button></div>').join('') + '</div>' +
      '<div class="fmt" role="group" aria-label="書き出し形式">' +
      [['css', 'CSS変数'], ['hex', 'HEX一覧'], ['json', 'JSON']].map((f) => '<button type="button" class="chip" data-fmt="' + f[0] + '" aria-pressed="' + (palFmt === f[0]) + '">' + f[1] + '</button>').join('') + '</div>' +
      '<textarea class="pal-out" id="pal-out" readonly aria-label="書き出し結果">' + esc(paletteText(palFmt)) + '</textarea>' +
      '<div class="pal-actions"><button type="button" class="btn primary" id="pal-copy">コピー</button>' +
      (CONFIG.fileSave ? '<button type="button" class="btn" id="pal-dl">ファイルに保存</button>' : '') +
      '<button type="button" class="btn" id="pal-clear">すべて外す</button></div>';
  }
  function initPalette() {
    const dlg = $('#dlg-palette');
    $('#btn-palette').addEventListener('click', () => { renderPalette(); openDialog(dlg); });
    dlg.addEventListener('click', (e) => {
      const t = e.target;
      const fmt = t.closest('[data-fmt]'); if (fmt) { palFmt = fmt.dataset.fmt; renderPalette(); return; }
      if (t.closest('#pal-copy')) { copyText($('#pal-out').value, 'パレットをコピーしました'); return; }
      const clr = t.closest('#pal-clear');
      if (clr) {
        // confirm() は埋め込み先で使えないことがあるため、ページ内で二度押しして確定する
        if (clr.dataset.armed !== '1') {
          clr.dataset.armed = '1'; clr.textContent = '本当にすべて外す';
          setTimeout(() => { if (clr.isConnected) { clr.dataset.armed = ''; clr.textContent = 'すべて外す'; } }, 3000);
          return;
        }
        const ids = favList.slice(); favList = []; saveFavs();
        ids.forEach((id) => $$('[data-fav="' + id + '"]').forEach((b) => b.setAttribute('aria-pressed', 'false')));
        renderPalette(); return;
      }
      if (t.closest('#pal-dl')) {
        const ext = { css: 'css', hex: 'txt', json: 'json' }[palFmt];
        const blob = new Blob([paletteText(palFmt)], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sekai-iro-palette.' + ext;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); return;
      }
      const rm = t.closest('.x[data-fav]'); if (rm) { toggleFav(rm.dataset.fav); return; }
      const op = t.closest('[data-open]'); if (op) { dlg.close(); openDetail(op.dataset.open); }
    });
  }

  /* ───────── 詳細 ───────── */
  const dlgDetail = () => $('#dlg-detail');
  function miniHTML(c, tag, nearFlag) {
    const r = RBY[c.region];
    return '<button type="button" class="mini" data-open="' + c.id + '" style="--c:' + c.hex + '"><span class="mini-sw"></span>' +
      '<span class="mini-txt"><b ' + nameAttrs(c) + '>' + esc(c.name) + '</b><small><span class="dot" style="--rc:' + r.color + '"></span>' + r.label + ' · ' + esc(c.roman) + ' · ' + c.hex + '</small></span>' +
      (tag ? '<span class="mini-tag' + (nearFlag ? ' near' : '') + '">' + tag + '</span>' : '') + '</button>';
  }
  function suggestions(c) {
    const h = c.hsl[0], s = c.hsl[1], l = c.hsl[2];
    return [['補色', 180], ['類似色 −30°', -30], ['類似色 +30°', 30], ['トライアド −120°', -120], ['トライアド +120°', 120]].map((d) => {
      const rgb = CU.hslToRgb(h + d[1], s, l).map(Math.round);
      return { label: d[0], hex: CU.rgbToHex(rgb[0], rgb[1], rgb[2]), match: nearestBy(CU.rgbToLab(rgb[0], rgb[1], rgb[2]), null, 1, c.id)[0] };
    });
  }
  function renderDetail(c) {
    const r = RBY[c.region], fam = FBY[c.family], tag = TBY[c.tag], fav = isFav(c.id);
    const list = visible.indexOf(c) >= 0 ? visible : ALL, idx = list.indexOf(c);
    const R = c.rgb[0], G = c.rgb[1], B = c.rgb[2], hsl = c.hsl;
    const cmyk = CU.rgbToCmyk(R, G, B), cw = CU.contrast(c.rgb, [255, 255, 255]), cb = CU.contrast(c.rgb, [0, 0, 0]);
    const grade = (v) => (v >= 7 ? 'AAA' : v >= 4.5 ? 'AA' : v >= 3 ? 'AA(大きな文字のみ)' : '基準未満');
    const code = (k, v) => '<div class="code"><b>' + k + '</b><code>' + esc(v) + '</code><button type="button" class="copy" data-copy="' + esc(v) + '">コピー</button></div>';
    const cross = REGIONS.filter((x) => x.id !== c.region).map((x) => nearestBy(c.lab, (k) => k.region === x.id, 1, c.id)[0])
      .sort((a, b) => a.d - b.d)
      .map((m) => { const q = closeness(m.d); return miniHTML(m.c, q[0], q[1]); }).join('');
    const same = nearestBy(c.lab, (k) => k.region === c.region, 4, c.id).map((m) => miniHTML(m.c, '')).join('');
    let sug;
    if (c.family === 'mono') sug = '<p class="hint">無彩色に近い色のため、色相をもとにした配色の提案は表示しません。</p>';
    else sug = '<div class="list-mini">' + suggestions(c).map((s) => miniHTML(s.match.c, s.label)).join('') + '</div>';

    dlgDetail().innerHTML =
      '<div class="dlg"><div class="dlg-body" style="padding:0">' +
      '<div class="d-hero" style="--c:' + c.hex + ';--t:' + c.text + '">' +
      '<div class="d-bar"><div class="d-nav">' +
      '<button type="button" class="d-btn" data-nav="-1" aria-label="前の色">←</button><button type="button" class="d-btn" data-nav="1" aria-label="次の色">→</button>' +
      '<span class="d-pos">' + (idx + 1) + ' / ' + list.length + '</span></div>' +
      '<div class="d-bar-r"><button type="button" class="d-btn" data-fav="' + c.id + '" aria-pressed="' + fav + '">' + ICON_HEART + '<span class="t">マイパレット</span></button>' +
      (CONFIG.hashState ? '<button type="button" class="d-btn" data-share aria-label="この色へのリンクをコピー">リンク</button>' : '') +
      '<button type="button" class="d-btn" data-close aria-label="閉じる">✕</button></div></div>' +
      '<div class="d-title"><p class="d-meta"><span class="pill">' + r.label + '</span><span class="pill">' + fam.label + '</span><span class="pill">' + tag.label + '</span></p>' +
      '<h2 id="d-name" ' + nameAttrs(c) + '>' + esc(c.name) + '</h2>' +
      '<p class="d-read">' + (c.kana ? '<span>' + (r.kanaLabel ? esc(r.kanaLabel) + '：' : '') + esc(c.kana) + '</span>' : '') + '<span class="d-roman">' + esc(c.roman) + '</span></p></div></div>' +
      '<div class="d-body"><div>' +
      '<div class="sec"><h3>由来・解説</h3><p class="d-note">' + esc(c.note) + '</p></div>' +
      '<div class="sec"><h3>カラーコード <small>クリックでコピー</small></h3><div class="codes">' +
      code('HEX', c.hex) + code('RGB', 'rgb(' + R + ', ' + G + ', ' + B + ')') +
      code('HSL', 'hsl(' + Math.round(hsl[0]) + ', ' + Math.round(hsl[1] * 100) + '%, ' + Math.round(hsl[2] * 100) + '%)') +
      code('CMYK', 'C' + cmyk[0] + ' M' + cmyk[1] + ' Y' + cmyk[2] + ' K' + cmyk[3]) + '</div>' +
      '<p class="hint" style="margin-top:8px">CMYKは単純計算による目安です。印刷では色見本で確認してください。</p></div>' +
      '<div class="sec"><h3>文字色としての見え方 <small>WCAG</small></h3><div class="contrast">' +
      '<div class="ct w" style="--c:' + c.hex + '"><strong>Aa あ</strong><span>白文字 ' + cw.toFixed(1) + ':1 · ' + grade(cw) + '</span></div>' +
      '<div class="ct k" style="--c:' + c.hex + '"><strong>Aa あ</strong><span>黒文字 ' + cb.toFixed(1) + ':1 · ' + grade(cb) + '</span></div></div></div>' +
      '</div><div>' +
      '<div class="sec"><h3>他の文化では？ <small>最も近い色</small></h3><div class="list-mini">' + cross + '</div>' +
      '<div class="d-actions"><button type="button" class="btn" data-finder="' + c.hex + '">この色で近い色を探す</button></div></div>' +
      '<div class="sec"><h3>配色の提案 <small>色相を回して、近い伝統色を当てた結果</small></h3>' + sug + '</div>' +
      '<div class="sec"><h3>同じ地域で近い色</h3><div class="list-mini">' + same + '</div></div>' +
      '</div></div></div></div>';
    const body = $('.dlg-body', dlgDetail()); if (body) body.scrollTop = 0;
  }
  function openDetail(id) {
    const c = byId[id]; if (!c) return;
    ['#dlg-finder', '#dlg-palette'].forEach((s) => { const d = $(s); if (d.open) d.close(); });
    selectedId = id; renderDetail(c); openDialog(dlgDetail()); writeHash();
  }
  function navDetail(step) {
    const c = byId[selectedId]; if (!c) return;
    const list = visible.indexOf(c) >= 0 ? visible : ALL;
    const n = list.length; const next = list[(list.indexOf(c) + step + n) % n];
    selectedId = next.id; renderDetail(next); writeHash();
    const b = $('[data-nav="' + (step > 0 ? 1 : -1) + '"]', dlgDetail()); if (b) b.focus();
  }
  function initDetail() {
    const dlg = dlgDetail();
    dlg.addEventListener('click', (e) => {
      const t = e.target;
      if (t === dlg || t.closest('[data-close]')) { dlg.close(); return; }
      const nav = t.closest('[data-nav]'); if (nav) { navDetail(parseInt(nav.dataset.nav, 10)); return; }
      const fav = t.closest('[data-fav]'); if (fav) { toggleFav(fav.dataset.fav); return; }
      const cp = t.closest('[data-copy]'); if (cp) { copyText(cp.dataset.copy); return; }
      if (t.closest('[data-share]')) { copyText(location.href, 'リンクをコピーしました'); return; }
      const fd = t.closest('[data-finder]'); if (fd) { dlg.close(); openFinder(fd.dataset.finder); return; }
      const op = t.closest('[data-open]'); if (op) openDetail(op.dataset.open);
    });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); navDetail(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); navDetail(1); }
    });
    dlg.addEventListener('close', () => { selectedId = null; writeHash(); });
  }

  /* ───────── 近い色を探す ───────── */
  let finderHex = '#C73E3A';
  function normHex(v) {
    v = String(v).trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(v)) v = v.split('').map((x) => x + x).join('');
    return /^[0-9a-fA-F]{6}$/.test(v) ? '#' + v.toUpperCase() : null;
  }
  function renderFinder() {
    const rgb = CU.hexToRgb(finderHex), lab = CU.rgbToLab(rgb[0], rgb[1], rgb[2]), tx = CU.readableText(rgb);
    const best = nearestBy(lab, null, 1)[0], br = RBY[best.c.region], q = closeness(best.d);
    const cols = REGIONS.map((r) => '<div class="f-col"><h3><span class="dot" style="--rc:' + r.color + '"></span>' + r.label + '</h3><div class="list-mini">' +
      nearestBy(lab, (c) => c.region === r.id, 3).map((m) => { const k = closeness(m.d); return miniHTML(m.c, k[0], k[1]); }).join('') + '</div></div>').join('');
    $('#f-results').innerHTML =
      '<div class="f-best"><div class="f-pair"><div style="background:' + finderHex + ';color:' + tx + '">あなたの色<br>' + finderHex + '</div><div style="background:' + best.c.hex + ';color:' + best.c.text + '">最も近い色<br>' + best.c.hex + '</div></div>' +
      '<div class="f-meta"><span class="hint">五つの文化の中で最も近いのは</span><b ' + nameAttrs(best.c) + '>' + esc(best.c.name) + '</b>' +
      '<span>' + br.label + ' · ' + esc(best.c.roman) + ' · ' + q[0] + '（ΔE ' + best.d.toFixed(1) + '）</span>' +
      '<div class="d-actions"><button type="button" class="btn primary" data-open="' + best.c.id + '">詳細を見る</button></div></div></div>' +
      '<div class="f-cols">' + cols + '</div>';
  }
  function setFinder(hex, fromText) {
    const n = normHex(hex); if (!n) return;
    finderHex = n; $('#f-color').value = n.toLowerCase(); if (!fromText) $('#f-hex').value = n; renderFinder();
  }
  function openFinder(hex) {
    if (hex) { const n = normHex(hex); if (n) finderHex = n; }
    $('#f-color').value = finderHex.toLowerCase(); $('#f-hex').value = finderHex; renderFinder(); openDialog($('#dlg-finder'));
  }
  function initFinder() {
    const dlg = $('#dlg-finder');
    $('#btn-finder').addEventListener('click', () => openFinder());
    $('#f-color').addEventListener('input', (e) => setFinder(e.target.value));
    $('#f-hex').addEventListener('input', (e) => { const n = normHex(e.target.value); if (n) setFinder(n, true); });
    $('#f-hex').addEventListener('blur', (e) => { e.target.value = finderHex; });
    $('#f-random').addEventListener('click', () => {
      const h = CU.hslToRgb(Math.random() * 360, 0.4 + Math.random() * 0.5, 0.3 + Math.random() * 0.4).map(Math.round);
      setFinder(CU.rgbToHex(h[0], h[1], h[2]));
    });
    if ('EyeDropper' in window) {
      const eb = $('#f-eye'); eb.hidden = false;
      eb.addEventListener('click', () => { new window.EyeDropper().open().then((r) => setFinder(r.sRGBHex)).catch(() => {}); });
    }
    dlg.addEventListener('click', (e) => {
      const t = e.target;
      if (t === dlg || t.closest('[data-close]')) { dlg.close(); return; }
      const op = t.closest('[data-open]'); if (op) { dlg.close(); openDetail(op.dataset.open); }
    });
  }

  /* ───────── ダイアログ共通 ───────── */
  function openDialog(d) {
    if (!d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    document.body.classList.add('lock');
  }
  function initDialogs() {
    $$('dialog').forEach((d) => {
      d.addEventListener('close', () => { if (!$$('dialog').some((x) => x.open)) document.body.classList.remove('lock'); });
    });
    $('#dlg-palette').addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.closest('[data-close]')) e.currentTarget.close(); });
  }

  /* ───────── 一覧のイベント ───────── */
  function initList() {
    $('#grid').addEventListener('click', (e) => {
      const f = e.target.closest('[data-fav]'); if (f) { toggleFav(f.dataset.fav); return; }
      const o = e.target.closest('[data-open]'); if (o) openDetail(o.dataset.open);
    });
    $('#regions').addEventListener('click', (e) => { const b = e.target.closest('[data-region]'); if (b) setState({ region: b.dataset.region }); });
    $('#family-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-family]'); if (b) setState({ family: state.family === b.dataset.family ? 'all' : b.dataset.family }); });
    $('#tag-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-tag]'); if (b) setState({ tag: state.tag === b.dataset.tag ? 'all' : b.dataset.tag }); });
    $('#view-seg').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setState({ view: b.dataset.view }); });
    $('#sort').addEventListener('change', (e) => setState({ sort: e.target.value }));
    let qt; $('#q').addEventListener('input', (e) => { clearTimeout(qt); const v = e.target.value; qt = setTimeout(() => setState({ q: v.trim() }), 120); });
    $('#reset').addEventListener('click', resetAll);
    $('#empty-reset').addEventListener('click', resetAll);
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) && !$$('dialog').some((d) => d.open)) { e.preventDefault(); $('#q').focus(); }
    });
  }

  /* ───────── テーマ ───────── */
  function initTheme() {
    $('#btn-theme').addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next; store.set('sekai-iro:theme', next);
      if (state.view === 'map' && visible.length) drawMap();
    });
  }

  /* ───────── 起動 ───────── */
  function init() {
    $('#total').textContent = ALL.length;
    readHash();
    buildRegions(); buildChips();
    initList(); initMap(); initDetail(); initFinder(); initPalette(); initDialogs(); initTheme();
    saveFavs();
    update();
    if (selectedId) { const id = selectedId; selectedId = null; openDetail(id); }
    window.__sekai = { count: ALL.length, state, byId, mapPts: () => mapPts }; // 検証用フック
  }
  init();
})();
