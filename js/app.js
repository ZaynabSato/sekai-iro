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
  // 地域は三つのまとまり(GROUPS)に分けて並べる。地域を足すときは、ここと js/data/<id>.js と index.html の script を揃える。
  const GROUPS = [
    { id: 'eurasia', label: 'アジア・欧州', en: 'Asia & Europe', desc: '日本と欧州に、中国・インド・ペルシャを加えた五つの文化です。' },
    { id: 'africa', label: 'アフリカ', en: 'Africa', desc: 'アフリカは、四つに分けました。北(アラビア語圏と古代エジプト)、西(染めと布)、東(サバンナとインド洋)、中南部(最古の顔料とビーズ)。' },
    { id: 'americas', label: 'アメリカ', en: 'The Americas', desc: '南北アメリカは、感性の異なる四つの系統を選びました。メソアメリカ、アンデス、北米先住民、熱帯アメリカ(アマゾン・ブラジル・カリブ)。' }
  ];
  const REGIONS = [
    { id: 'jp', group: 'eurasia', label: '日本', en: 'Japan', sub: 'Japan', lang: 'ja', color: '#c13b48', kanaLabel: '読み', romanLabel: 'ローマ字',
      script: '漢字・かな', sense: '移ろいを呼び分ける', desc: '植物・季節・染料に由来する名前で、淡い違いまで細かく呼び分けます。襲(かさね)の色目や、江戸の「四十八茶百鼠」のように、わずかな差を楽しむ感性が根にあります。' },
    { id: 'eu', group: 'eurasia', label: '欧州', en: 'Europe', sub: 'Europe', lang: 'ja', color: '#3b57b5', kanaLabel: '', romanLabel: '原語・英語表記',
      script: 'カタカナ(原語は右の欄)', sense: '顔料と紋章', desc: 'ラピスラズリやコチニールなどの顔料・染料、宝石、王侯や軍の制服に由来する名前が多く、色が素材と権威の歴史を背負っています。' },
    { id: 'cn', group: 'eurasia', label: '中国', en: 'China', sub: 'China', lang: 'zh-Hant', color: '#d0a02b', kanaLabel: '日本語読み', romanLabel: 'ピンイン',
      script: '繁体字', sense: '正色と五行', desc: '五行思想に基づく正色(青・赤・黄・白・黒)を軸に、朱砂・黛・石青などの顔料、玉や絹、漆の色が名前になっています。' },
    { id: 'in', group: 'eurasia', label: 'インド', en: 'India', sub: 'India', lang: 'hi', color: '#e97f1e', kanaLabel: 'カナ読み', romanLabel: '翻字',
      script: 'デーヴァナーガリー(ヒンディー語)', sense: '祝祭と香辛料', desc: 'ホーリー祭の色粉、サフランやウコン、婚礼の赤。儀礼と食の色が、彩度の高い名前になっています。' },
    { id: 'ir', group: 'eurasia', label: 'ペルシャ', en: 'Persia', sub: 'Persia · Iran', lang: 'fa', dir: 'rtl', color: '#1ea8a1', kanaLabel: 'カナ読み', romanLabel: '翻字',
      script: 'ペルシャ文字(右から左)', sense: 'タイルと庭園', desc: 'トルコ石やラピスラズリの青、バラの庭、細密画の顔料。イスラム建築のタイルの青が、色名の中心にあります。' },
    { id: 'naf', group: 'africa', label: '北アフリカ', en: 'North Africa', sub: 'エジプト・マグリブ・サハラ', lang: 'ar', dir: 'rtl', color: '#8b5cc2', kanaLabel: 'カナ読み', romanLabel: '翻字',
      script: 'アラビア文字(右から左)', sense: '石灰・藍・土', desc: '白い壁に青を添える石灰と藍、サハラの砂と夕日、古代エジプトの顔料とスパイス。名前はアラビア語です。' },
    { id: 'waf', group: 'africa', label: '西アフリカ', en: 'West Africa', sub: 'ガーナ・ナイジェリア・マリ・セネガルほか', lang: 'und', color: '#4c9a3a', kanaLabel: 'カナ読み', romanLabel: '英語での意味',
      script: 'ラテン文字(トゥイ語・ヨルバ語・ハウサ語・フランス語ほか)', sense: '染めと布、金', desc: '藍染め、泥染め、ケンテ。布が色を語り、金とカムウッドの赤が、王権と儀礼を表します。' },
    { id: 'eaf', group: 'africa', label: '東アフリカ', en: 'East Africa', sub: 'ケニア・タンザニア・エチオピア・マダガスカルほか', lang: 'und', color: '#c4572e', kanaLabel: 'カナ読み', romanLabel: '英語での意味',
      script: 'ラテン文字(スワヒリ語を中心に、アムハラ語・マダガスカル語ほか)', sense: 'サバンナとインド洋', desc: '赤い布と珠飾りの色の暗号、ザンジバルのスパイス、エチオピア高原のコーヒー、火山と塩湖。大地と海の両方から、色が呼ばれます。' },
    { id: 'saf', group: 'africa', label: '中南部アフリカ', en: 'Central & Southern Africa', sub: '南アフリカ・ナミビア・ボツワナ・コンゴほか', lang: 'und', color: '#a8a82a', kanaLabel: 'カナ読み', romanLabel: '英語での意味',
      script: 'ラテン文字(ズールー語・ツワナ語・アフリカーンス語・フランス語ほか)', sense: '最古の顔料とビーズ', desc: '約10万年前の赤黄土から、ズールーのビーズの色の暗号、ンデベレの壁、塩の湖と砂丘、鉱物の大地まで。' },
    { id: 'mes', group: 'americas', label: 'メソアメリカ', en: 'Mesoamerica', sub: 'メキシコ・グアテマラ・中米', lang: 'es', color: '#d6389a', kanaLabel: 'カナ読み', romanLabel: '英語での意味',
      script: 'ラテン文字(スペイン語・ナワトル語・マヤ語)', sense: '祝祭と対比', desc: 'コチニールの赤とマリーゴールドの橙、桃色と青の壁、トウモロコシの四つの色。強い色同士をぶつけ合う、祝祭の感性です。' },
    { id: 'and', group: 'americas', label: 'アンデス', en: 'Andes', sub: 'ペルー・ボリビア・チリ・アルゼンチン', lang: 'es', color: '#2a8fd0', kanaLabel: 'カナ読み', romanLabel: '英語での意味',
      script: 'ラテン文字(ケチュア語・アイマラ語・マプチェ語・スペイン語)', sense: '高地の染織と毛色', desc: 'コチニールで染めた赤と、アルパカの天然の毛色。塩の湖や虹色の山の、鉱物の色。標高の高さが、色を澄ませます。' },
    { id: 'nam', group: 'americas', label: '北米先住民', en: 'Native North America', sub: '米国・カナダの先住民族', lang: 'en', color: '#8a6a45', kanaLabel: 'カナ読み', romanLabel: '民族・地域',
      script: '英語(右の欄に民族・地域)', sense: '大地・空・四つの方角', desc: '砂岩の赤、トルコ石の青、貝と染料植物。色が方角や聖なる山と結びつく民族もありますが、意味は民族ごとに異なります。' },
    { id: 'tro', group: 'americas', label: '熱帯アメリカ', en: 'Tropical Americas', sub: 'ブラジル・アマゾン・カリブ海・コロンビア', lang: 'und', color: '#14a37f', kanaLabel: 'カナ読み', romanLabel: '英語での意味',
      script: 'ラテン文字(ポルトガル語・スペイン語・トゥピ語ほか)', sense: '果実と密林と港町', desc: 'ジェニパポの青黒とウルクンの赤、黒い川と白い砂丘、果実と葉巻の茶、オリシャの色。熱と湿気をまとった色です。' }
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
  const GBY = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
  const regionLabel = (id) => (RBY[id] ? RBY[id].label : GBY[id] ? GBY[id].label : id);
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
        region: r.id, group: r.group, order: ALL.length,
        name: a[0], kana: a[1], roman: a[2], hex, note: a[4], tag: a[5],
        rgb, lab, hsl: CU.rgbToHsl(rgb[0], rgb[1], rgb[2]),
        family: CU.classify(hex), text: CU.readableText(rgb),
        chroma: Math.hypot(lab[1], lab[2]),
        sortKey: CU.normalize(a[1] || a[0]),
        key: CU.normalize([a[0], a[1], a[2], hex, a[4], r.label, r.en, GBY[r.group].label, FBY[CU.classify(hex)].label, TBY[a[5]].label].join(' '))
      };
      ALL.push(c); byId[c.id] = c;
    });
  });

  /* ───────── 配色例 ───────── */
  const SCHEMES = [];
  const WARM = { red: 1, orange: 1, yellow: 1, pink: 1, brown: 1 };
  (function () {
    const idx = {};
    ALL.forEach((c) => { (idx[c.region] = idx[c.region] || {})[CU.nameKey(c.name)] = c; });
    const per = {};
    (window.SEKAI_SCHEMES || []).forEach((s) => {
      if (!RBY[s.r]) return;
      const parts = s.c.map((p) => ({ c: (idx[s.r] || {})[CU.nameKey(p[0])], w: p[1] })).filter((p) => p.c);
      if (parts.length < 2) return;
      per[s.r] = (per[s.r] || 0) + 1;
      const tw = parts.reduce((a, p) => a + p.w, 0);
      let warm = 0, cool = 0;
      parts.forEach((p) => { if (p.c.family === 'mono') return; if (WARM[p.c.family]) warm += p.w; else cool += p.w; });
      const Ls = parts.map((p) => p.c.lab[0]);
      SCHEMES.push({
        id: s.r + '-s' + per[s.r], region: s.r, group: RBY[s.r].group, name: s.name, kind: s.k, note: s.note, parts, n: parts.length,
        stat: { chroma: parts.reduce((a, p) => a + p.w * p.c.chroma, 0) / tw, lrange: Math.max.apply(null, Ls) - Math.min.apply(null, Ls), warm: warm + cool ? warm / (warm + cool) : 0.5 }
      });
    });
  })();
  const SBY = Object.fromEntries(SCHEMES.map((s) => [s.id, s]));
  const inScope = (s, region) => region === 'all' || s.region === region || s.group === region;

  /* ───────── 状態 ───────── */
  // page: 表示するタブ(colors=色を引く / schemes=配色例 / tryon=着せ替え)  sn: 配色例の色数での絞り込み
  const DEFAULTS = { region: 'all', family: 'all', tag: 'all', q: '', sort: 'order', view: 'grid', page: 'colors', sn: 'all' };
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
    if (skip !== 'region' && state.region !== 'all' && c.region !== state.region && c.group !== state.region) return false;
    if (skip !== 'family' && state.family !== 'all' && c.family !== state.family) return false;
    if (skip !== 'tag' && state.tag !== 'all' && c.tag !== state.tag) return false;
    for (let i = 0; i < tokens.length; i++) if (c.key.indexOf(tokens[i]) < 0) return false;
    return true;
  }
  // すべての色との色差(CIEDE2000)を近い順に並べる。地域ごとの最近傍は、この結果から拾う(色差の計算は一度だけ)。
  function rankAll(lab, excludeId) {
    const arr = [];
    for (let i = 0; i < ALL.length; i++) {
      const c = ALL[i];
      if (c.id !== excludeId) arr.push({ c, d: CU.deltaE(lab, c.lab) });
    }
    arr.sort((a, b) => a.d - b.d);
    return arr;
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
  // 地域ごとの最近傍を、近い順に返す(rank は rankAll の結果)
  function bestPerRegion(rank, exceptRegion, per) {
    const got = {}, out = [];
    for (let i = 0; i < rank.length; i++) {
      const m = rank[i], r = m.c.region;
      if (r === exceptRegion) continue;
      got[r] = (got[r] || 0) + 1;
      if (got[r] <= per) out.push(m);
    }
    return out;
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
    if (state.page !== 'colors') p.push('p=' + state.page);
    if (state.sn !== 'all' && state.page === 'schemes') p.push('n=' + state.sn);
    if (state.page === 'tryon') {
      p.push('tp=' + ty.tpl);
      if (ty.srcId) p.push('ps=' + ty.srcId); else if (ty.pal.length) p.push('pc=' + ty.pal.map((x) => x.hex.slice(1)).join(','));
    }
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
      if (k === 'r' && (v === 'all' || RBY[v] || GBY[v])) state.region = v;
      else if (k === 'f' && FBY[v]) state.family = v;
      else if (k === 't' && TBY[v]) state.tag = v;
      else if (k === 'q') state.q = v.slice(0, 80);
      else if (k === 's' && SORTS[v]) state.sort = v;
      else if (k === 'v' && (v === 'grid' || v === 'list' || v === 'map')) state.view = v;
      else if (k === 'p' && (v === 'schemes' || v === 'tryon')) state.page = v;
      else if (k === 'n' && /^[2-5]$/.test(v)) state.sn = v;
      else if (k === 'tp' && TPL[v]) ty.tpl = v;
      else if (k === 'ps' && SBY[v]) tyLoadScheme(SBY[v], true);
      else if (k === 'pc') {
        const hs = v.split(',').map((h) => '#' + h.toUpperCase()).filter((h) => /^#[0-9A-F]{6}$/.test(h)).slice(0, 8);
        if (hs.length >= 2) { ty.pal = hs.map((h, i) => ({ hex: h, w: hs.length - i })); ty.srcId = ''; }
      }
      else if (k === 'c' && byId[v]) selectedId = v;
    });
  }

  /* ───────── 地域ボタン / チップ ───────── */
  function buildRegions() {
    const strip = (list) => '<span class="rg-strip">' + sampleStrip(list, 6).map((c) => '<i style="background:' + c.hex + '"></i>').join('') + '</span>';
    const card = (r) => '<button type="button" class="region" data-region="' + r.id + '" aria-pressed="false" style="--rc:' + r.color + '">' +
      '<span class="rg-top"><span class="rg-name">' + r.label + '</span></span>' +
      '<span class="rg-en">' + esc(r.sub) + '</span>' + strip(ALL.filter((c) => c.region === r.id)) + '<span class="rg-count"></span></button>';
    $('#regions').innerHTML =
      '<div class="rg-all"><button type="button" class="region region-all" data-region="all" aria-pressed="false" style="--rc:#6b5f52">' +
      '<span class="rg-name">すべて</span><span class="rg-en">All regions</span><span class="rg-count"></span></button></div>' +
      GROUPS.map((g) => '<section class="rg-group" aria-label="' + g.label + '">' +
        '<div class="rg-head"><button type="button" class="rg-group-btn" data-region="' + g.id + '" aria-pressed="false">' +
        '<span class="rg-gname">' + g.label + '</span><span class="rg-gen">' + g.en + '</span><span class="rg-count"></span></button></div>' +
        '<div class="rg-cards">' + REGIONS.filter((r) => r.group === g.id).map(card).join('') + '</div></section>').join('');
  }
  // 選んでいる地域(または地域のまとまり)の紹介
  function renderIntro() {
    const el = $('#rg-intro'), id = state.region, r = RBY[id], g = GBY[id];
    if (id === 'all' || (!r && !g)) { el.hidden = true; el.innerHTML = ''; return; }
    const n = ALL.filter((c) => c.region === id || c.group === id).length;
    el.style.setProperty('--rc', r ? r.color : '#6b5f52');
    if (r) {
      el.innerHTML = '<div class="intro-head"><span class="dot" style="--rc:' + r.color + '"></span><b>' + r.label + '</b><span class="intro-en">' + r.en + '</span><span class="intro-sense">' + r.sense + '</span></div>' +
        '<p>' + r.desc + '</p>' +
        (state.page !== 'colors' && SCHEME_SENSE[r.id] ? '<p class="intro-scheme"><b>配色の感性</b>' + SCHEME_SENSE[r.id] + '</p>' : '') +
        '<p class="intro-meta">' + n + '色 · ' + SCHEMES.filter((s) => s.region === id).length + '配色 · 名前の表記: ' + r.script + '</p>';
    } else {
      el.innerHTML = '<div class="intro-head"><b>' + g.label + '</b><span class="intro-en">' + g.en + '</span></div><p>' + g.desc + '</p>' +
        '<div class="intro-regions">' + REGIONS.filter((x) => x.group === g.id).map((x) =>
          '<button type="button" class="chip" data-region="' + x.id + '"><i style="background:' + x.color + '"></i>' + x.label + '</button>').join('') + '</div>' +
        '<p class="intro-meta">' + n + '色</p>';
    }
    el.hidden = false;
  }
  function buildChips() {
    const mk = (attr, id, label, dot) => '<button type="button" class="chip" data-' + attr + '="' + id + '" aria-pressed="false">' + (dot ? '<i style="background:' + dot + '"></i>' : '') + label + '<em></em></button>';
    $('#family-chips').innerHTML = mk('family', 'all', 'すべて') + FAMILIES.map((f) => mk('family', f.id, f.label, f.dot)).join('');
    $('#tag-chips').innerHTML = mk('tag', 'all', 'すべて') + TAGS.map((t) => mk('tag', t.id, t.label)).join('');
  }
  function refreshControls() {
    const base = ALL;
    const count = (skip, pred) => { let n = 0; for (let i = 0; i < base.length; i++) { if (matches(base[i], skip) && pred(base[i])) n++; } return n; };
    $$('[data-region]', $('#regions')).forEach((b) => {
      const id = b.dataset.region; b.setAttribute('aria-pressed', String(state.region === id));
      $('.rg-count', b).textContent = state.page === 'colors'
        ? count('region', (c) => id === 'all' || c.region === id || c.group === id) + ' 色'
        : SCHEMES.filter((s) => inScope(s, id)).length + ' 配色';
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
    refreshTabs();
    refreshControls();
    renderIntro();
    if (state.page === 'colors') renderColors();
    else if (state.page === 'schemes') renderSchemes();
    else renderTryon();
    writeHash();
  }
  function refreshTabs() {
    $$('#tabs .tab').forEach((b) => { const on = b.dataset.page === state.page; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    ['colors', 'schemes', 'tryon'].forEach((p) => { $('#panel-' + p).hidden = state.page !== p; });
    $('#regions').classList.toggle('compact', state.page !== 'colors'); // 配色例・着せ替えでは、地域の選択を小さくして、中身を上に出す
  }
  function renderColors() {
    const filtered = state.region !== 'all' || state.family !== 'all' || state.tag !== 'all' || !!state.q;
    const parts = [];
    if (state.region !== 'all') parts.push(regionLabel(state.region));
    if (state.family !== 'all') parts.push(FBY[state.family].label);
    if (state.tag !== 'all') parts.push(TBY[state.tag].label);
    if (state.q) parts.push('「' + esc(state.q) + '」');
    $('#count').innerHTML = (parts.length ? parts.join(' · ') + ' — ' : '') + '<b>' + visible.length + '</b> 色' + (state.sort !== 'order' ? '（' + SORT_LABEL[state.sort] + '）' : '');
    $('#reset').hidden = !filtered;

    const grid = $('#grid'), mapWrap = $('#map-wrap'), empty = $('#empty');
    empty.hidden = visible.length > 0;
    shown = PAGE;
    if (state.view === 'map') {
      grid.hidden = true; mapWrap.hidden = visible.length === 0; if (visible.length) drawMap();
      $('#more-wrap').hidden = true;
    } else {
      mapWrap.hidden = true; grid.hidden = visible.length === 0;
      grid.classList.toggle('list', state.view === 'list');
      grid.innerHTML = visible.slice(0, shown).map(cardHTML).join('');
      syncMore();
    }
  }
  // 一覧は PAGE 枚ずつ描画する(1000枚超を一度に出すと、起動やダイアログの表示が重くなるため)。続きは、末尾が近づくと自動で足す。
  const PAGE = 120;
  let shown = PAGE;
  function syncMore() {
    const rest = visible.length - Math.min(shown, visible.length);
    $('#more-wrap').hidden = rest <= 0 || state.view === 'map';
    $('#more-n').textContent = rest;
  }
  function loadMore() {
    if (state.view === 'map' || shown >= visible.length) return;
    const from = shown; shown += PAGE;
    $('#grid').insertAdjacentHTML('beforeend', visible.slice(from, shown).map(cardHTML).join(''));
    syncMore();
  }
  function setState(patch) {
    const regionChanged = patch.region !== undefined && patch.region !== state.region;
    Object.assign(state, patch);
    // 着せ替えで地域を切り替えたら、その地域の配色に切り替える
    if (state.page === 'tryon' && regionChanged) { const cur = SBY[ty.srcId]; if (!cur || !inScope(cur, state.region)) { const f = SCHEMES.find((s) => inScope(s, state.region)); if (f) tyLoadScheme(f); } }
    update();
  }
  function resetAll() { Object.assign(state, DEFAULTS, { page: state.page }); update(); }

  /* ───────── 配色例タブ ───────── */
  const SCHEME_SENSE = {
    jp: '低彩度の微差と、白の余白。同じ系統の濃淡を重ねる。',
    eu: '顔料や紋章に由来する、明暗のはっきりした対比。',
    cn: '五行の正色を軸にした、赤・金・青の格調ある対比。',
    in: '高彩度の多色を、金と合わせて華やかに重ねる。',
    ir: '深い青(トルコ石とラピスラズリ)を主役に、金と赤を差す。',
    naf: '白い壁に青、砂漠の橙。暖色と寒色がはっきり分かれる。',
    waf: '布が主役。金・赤・緑・黒、または藍と白の力強い対比。',
    eaf: '赤を主役に、青と白で締める。色の意味で並べる。',
    saf: '黒い縁取りで、原色を面として並べる。',
    mes: '強い色同士をぶつける、祝祭の配色。',
    and: '染めない毛色の低彩度と、染めの赤・黄・青の鮮烈さ。',
    nam: '大地の色を基調に、トルコ石の青と赤を差す。四方位の四色。',
    tro: '果実の暖色と、森や水の緑・黒。熱を帯びた配色。'
  };
  function schemeHTML(s) {
    const r = RBY[s.region];
    const label = s.name + 'の配色: ' + s.parts.map((p) => p.c.name + ' ' + p.c.hex).join('、');
    return '<li class="scheme" style="--rc:' + r.color + '">' +
      '<div class="sc-strip" role="img" aria-label="' + esc(label) + '">' + s.parts.map((p) => '<i style="flex:' + p.w + ';background:' + p.c.hex + '"></i>').join('') + '</div>' +
      '<div class="sc-body"><div class="sc-meta"><span class="dot" style="--rc:' + r.color + '"></span>' + r.label + '<span class="sc-n">' + s.n + '色</span><span class="sc-kind">' + esc(s.kind) + '</span></div>' +
      '<h3 class="sc-name">' + esc(s.name) + '</h3><p class="sc-note">' + esc(s.note) + '</p>' +
      '<ul class="sc-colors">' + s.parts.map((p) => '<li><button type="button" class="sc-chip" data-open="' + p.c.id + '" style="--c:' + p.c.hex + '"><i></i><span ' + nameAttrs(p.c) + '>' + esc(p.c.name) + '</span><small>' + p.c.hex + '</small></button></li>').join('') + '</ul>' +
      '<div class="sc-actions"><button type="button" class="btn primary" data-try="' + s.id + '">着せ替えで試す</button><button type="button" class="btn" data-addpal="' + s.id + '">マイパレットに足す</button></div></div></li>';
  }
  function renderSchemes() {
    const scoped = SCHEMES.filter((s) => inScope(s, state.region));
    const bucket = (s) => Math.min(s.n, 5);
    const list = scoped.filter((s) => state.sn === 'all' || bucket(s) === +state.sn);
    $('#sc-chips').innerHTML = [['all', 'すべて'], ['2', '2色'], ['3', '3色'], ['4', '4色'], ['5', '5色以上']].map((o) => {
      const n = o[0] === 'all' ? scoped.length : scoped.filter((s) => bucket(s) === +o[0]).length;
      return '<button type="button" class="chip" data-sn="' + o[0] + '" aria-pressed="' + (state.sn === o[0]) + '" data-zero="' + (n === 0) + '">' + o[1] + '<em>' + n + '</em></button>';
    }).join('');
    const parts = []; if (state.region !== 'all') parts.push(regionLabel(state.region)); if (state.sn !== 'all') parts.push(state.sn === '5' ? '5色以上' : state.sn + '色');
    $('#sc-count').innerHTML = (parts.length ? parts.join(' · ') + ' — ' : '') + '<b>' + list.length + '</b> 配色';
    $('#sc-list').innerHTML = list.map(schemeHTML).join('');
    $('#sc-empty').hidden = list.length > 0;
    renderCompare(scoped);
  }
  // 掲載した配色例の平均から、文化ごとの配色の傾向を並べる(優劣ではなく、違いを見るための目安)
  function renderCompare(scoped) {
    const el = $('#sc-compare');
    const regs = REGIONS.filter((r) => scoped.some((s) => s.region === r.id));
    if (regs.length < 2) { el.hidden = true; el.innerHTML = ''; return; }
    const avg = (arr, f) => arr.reduce((a, s) => a + f(s), 0) / arr.length;
    const row = (r) => {
      const ss = scoped.filter((s) => s.region === r.id);
      const v = { c: avg(ss, (s) => s.stat.chroma), l: avg(ss, (s) => s.stat.lrange), w: avg(ss, (s) => s.stat.warm), n: avg(ss, (s) => s.n) };
      const bar = (pct, txt) => '<span class="cmp-bar"><i style="width:' + Math.max(3, Math.min(100, pct)) + '%"></i></span><em>' + txt + '</em>';
      return '<button type="button" class="cmp-row" data-region="' + r.id + '" style="--rc:' + r.color + '"><span class="cmp-name"><span class="dot" style="--rc:' + r.color + '"></span>' + r.label + '</span>' +
        '<span class="cmp-cell">' + bar(v.c / 70 * 100, Math.round(v.c)) + '</span><span class="cmp-cell">' + bar(v.l, Math.round(v.l)) + '</span>' +
        '<span class="cmp-cell">' + bar(v.w * 100, Math.round(v.w * 100) + '%') + '</span><span class="cmp-n">' + v.n.toFixed(1) + '色</span></button>';
    };
    el.innerHTML = '<h3>文化ごとの配色の傾向</h3><p class="hint">掲載した配色例の平均です。文化の優劣ではなく、配色の感性の違いを見るための目安です(押すと、その地域に絞り込みます)。</p>' +
      '<div class="cmp-head"><span></span><span>鮮やかさ</span><span>明暗の差</span><span>暖色の割合</span><span>平均色数</span></div>' + regs.map(row).join('');
    el.hidden = false;
  }
  function initSchemes() {
    $('#sc-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-sn]'); if (b) setState({ sn: state.sn === b.dataset.sn ? 'all' : b.dataset.sn }); });
    $('#sc-compare').addEventListener('click', (e) => { const b = e.target.closest('[data-region]'); if (b) setState({ region: b.dataset.region }); });
    $('#sc-list').addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]'); if (o) { openDetail(o.dataset.open); return; }
      const t = e.target.closest('[data-try]');
      if (t) { tyLoadScheme(SBY[t.dataset.try]); state.page = 'tryon'; update(); const tb = $('#tabs'); window.scrollTo({ top: Math.max(0, tb.getBoundingClientRect().top + window.scrollY - 70), behavior: 'smooth' }); return; }
      const a = e.target.closest('[data-addpal]');
      if (a) {
        const s = SBY[a.dataset.addpal]; let n = 0;
        s.parts.forEach((p) => { if (!isFav(p.c.id)) { favList.push(p.c.id); n++; $$('[data-fav="' + p.c.id + '"]').forEach((b) => b.setAttribute('aria-pressed', 'true')); } });
        saveFavs(); toast(n ? '「' + s.name + '」の ' + n + ' 色をマイパレットに足しました' : 'すべてマイパレットに入っています');
      }
    });
  }

  /* ───────── 着せ替えタブ ───────── */
  const TRY = window.SEKAI_TRYON || { templates: [], svg: () => '', PLAIN: '#e9e5de' };
  const TPL = Object.fromEntries(TRY.templates.map((t) => [t.id, t]));
  const ty = { tpl: TRY.templates.length ? TRY.templates[0].id : '', pal: [], srcId: '', shift: 0, perm: null, over: {}, sel: null, brush: null, plain: false, cycle: 0 };
  const TY_ICON = {
    outfit: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M8.5 3.5 3 6.5l2 4 2-1V20h10V9.5l2 1 2-4-5.5-3a3.5 3.5 0 0 1-7 0z"/></svg>',
    room: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M3 14a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4H3zM6 18v2M18 18v2"/></svg>',
    goods: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" d="M4 8h11v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM15 10h2a2.5 2.5 0 0 1 0 5h-2M7 4v1.5M10 3.5V5M13 4v1.5"/></svg>'
  };
  const labL = (hex) => { const r = CU.hexToRgb(hex); return CU.rgbToLab(r[0], r[1], r[2])[0]; };
  function tyLoadScheme(s) {
    ty.pal = s.parts.map((p) => ({ hex: p.c.hex, w: p.w, name: p.c.name, id: p.c.id }));
    ty.srcId = s.id; ty.shift = 0; ty.perm = null; ty.over = {}; ty.plain = false; ty.brush = null;
  }
  function tyCustom(pal) { ty.pal = pal; ty.srcId = ''; ty.shift = 0; ty.perm = null; ty.over = {}; ty.plain = false; ty.brush = null; }
  // 配色の色を、テンプレートのパーツへ割り当てる。大きい面(壁・床・背景)は比率の大きい色・明るい色、小さい面は差し色。
  function tyAssign(tpl, pal, shift, perm) {
    const out = {}, n = pal.length; if (!n) return out;
    let arr = pal.slice().sort((a, b) => b.w - a.w);
    if (perm && perm.length === n) arr = perm.map((i) => arr[i]);
    const Ls = arr.map((p) => labL(p.hex));
    const byL = arr.map((p, i) => i).sort((a, b) => Ls[b] - Ls[a]);
    const cand = (pref) => {
      if (pref === 'light') return byL.map((i) => arr[i].hex);
      if (pref === 'dark') return byL.slice().reverse().map((i) => arr[i].hex);
      const r = []; for (let t = 0; t < n; t++) r.push(arr[(pref + shift + t) % n].hex); return r;
    };
    const BG = { bg: 1, wall: 1, desk: 1 };
    let bgHex = null;
    tpl.slots.forEach((s) => { if (BG[s.id]) { bgHex = cand(s.pref)[0]; out[s.id] = bgHex; } });
    // 隣り合うパーツ(vs)や背景と同じ色にならないよう、可能な範囲でずらす
    tpl.slots.forEach((s) => {
      if (BG[s.id]) return;
      const c = cand(s.pref), near = (s.vs || []).map((id) => out[id]).filter(Boolean);
      const strict = near.concat(n >= 3 ? [bgHex] : []);
      out[s.id] = c.find((h) => strict.indexOf(h) < 0) || c.find((h) => near.indexOf(h) < 0) || c[0];
    });
    return out;
  }
  const tyColors = () => (ty.plain ? {} : Object.assign(tyAssign(TPL[ty.tpl], ty.pal, ty.shift, ty.perm), ty.over));
  function tyRefresh() { renderTryon(); writeHash(); }
  function tyPaint(slotId, hex) { ty.over[slotId] = hex; ty.plain = false; }
  function tySelect(slotId) { ty.sel = slotId; if (ty.brush) tyPaint(slotId, ty.brush); tyRefresh(); }
  function renderTryon() {
    if (!ty.pal.length) { const f = SCHEMES.find((s) => inScope(s, state.region)) || SCHEMES[0]; if (f) tyLoadScheme(f); }
    const tpl = TPL[ty.tpl]; if (!tpl) return;
    if (!tpl.slots.some((s) => s.id === ty.sel)) ty.sel = null;
    const cols = tyColors();
    $('#ty-tpls').innerHTML = TRY.templates.map((t) => '<button type="button" class="ty-tpl" data-tpl="' + t.id + '" aria-pressed="' + (t.id === ty.tpl) + '">' + TY_ICON[t.id] + '<span><b>' + t.cat + '</b><small>' + t.label + '</small></span></button>').join('');
    // 配色例の選択肢(初回だけ作る)
    const sel = $('#ty-scheme');
    if (!sel.options.length) {
      sel.innerHTML = '<option value="">(自分で作った配色)</option>' + GROUPS.map((g) => '<optgroup label="' + g.label + '">' + REGIONS.filter((r) => r.group === g.id).map((r) =>
        SCHEMES.filter((s) => s.region === r.id).map((s) => '<option value="' + s.id + '">' + esc(r.label + ' · ' + s.name + '(' + s.n + '色)') + '</option>').join('')).join('') + '</optgroup>').join('');
    }
    sel.value = ty.srcId || '';
    // 使う色
    const cur = ty.srcId && SBY[ty.srcId];
    $('#ty-pal').innerHTML = ty.pal.map((p, i) => '<div class="ty-chip"><button type="button" class="ty-sw" data-tycol="' + i + '" aria-pressed="' + (ty.brush === p.hex) + '" style="--c:' + p.hex + '" aria-label="' + esc((p.name || p.hex) + ' ' + p.hex + ' を選ぶ') + '"><span></span></button>' +
      '<span class="ty-ci"><b>' + esc(p.name || p.hex) + '</b><small>' + p.hex + '</small></span>' +
      (ty.pal.length > 1 ? '<button type="button" class="x" data-tyrm="' + i + '" aria-label="' + esc((p.name || p.hex)) + 'を外す">✕</button>' : '') + '</div>').join('');
    // パーツ
    $('#ty-slots').innerHTML = tpl.slots.map((s) => '<li><button type="button" class="ty-slot" data-slot="' + s.id + '" aria-pressed="' + (ty.sel === s.id) + '"><i style="background:' + (cols[s.id] || TRY.PLAIN) + '"></i><span>' + s.label + '</span><small>' + (cols[s.id] || '—') + '</small></button></li>').join('');
    $('#ty-plain').textContent = ty.plain ? '色を戻す' : 'プレーンに戻す';
    // 図
    $('#ty-stage').innerHTML = TRY.svg(tpl, ty.plain ? {} : cols, { label: tpl.cat + '(' + tpl.label + ')に配色を当てたプレビュー' }) +
      '<figcaption>' + (ty.plain ? 'プレーンなテンプレート' : (cur ? '<span class="dot" style="--rc:' + RBY[cur.region].color + '"></span>' + RBY[cur.region].label + ' · ' + esc(cur.name) : '自分で作った配色') + '(' + ty.pal.length + '色)') + '</figcaption>';
    if (ty.sel) { const g = $('#ty-stage [data-slot="' + ty.sel + '"]'); if (g) g.classList.add('sel'); }
    // 文化を見比べる
    const single = !!RBY[state.region];
    const scoped = SCHEMES.filter((s) => inScope(s, state.region));
    const items = single ? scoped : REGIONS.map((r) => { const l = scoped.filter((s) => s.region === r.id); return l.length ? l[ty.cycle % l.length] : null; }).filter(Boolean);
    $('#ty-cmp-title').textContent = single ? RBY[state.region].label + 'の配色を、同じ形で' : (state.region === 'all' ? REGIONS.length + 'の文化' : regionLabel(state.region)) + 'を、同じ形で見比べる';
    $('#ty-grid').dataset.tpl = ty.tpl;
    $('#ty-cycle').hidden = single || items.length === 0;
    $('#ty-cmp-note').textContent = single ? '押すと、上のプレビューにその配色を当てます。' : '文化ごとに、配色例を一つずつ当てています。押すと、上のプレビューにその配色を当てます。';
    $('#ty-grid').innerHTML = items.map((s) => {
      const r = RBY[s.region]; const c = tyAssign(tpl, s.parts.map((p) => ({ hex: p.c.hex, w: p.w })), 0, null);
      return '<button type="button" class="ty-cell" data-tyscheme="' + s.id + '" aria-pressed="' + (s.id === ty.srcId) + '" aria-label="' + esc(r.label + ' ' + s.name + ' を当てる') + '">' + TRY.svg(tpl, c) +
        '<span class="ty-cap"><span class="dot" style="--rc:' + r.color + '"></span><b>' + r.label + '</b><small>' + esc(s.name) + '</small></span></button>';
    }).join('');
  }
  function tySvgToPng() {
    const tpl = TPL[ty.tpl]; const S = 2;
    let s = TRY.svg(tpl, ty.plain ? {} : tyColors()).replace('<svg ', '<svg width="' + tpl.w * S + '" height="' + tpl.h * S + '" ');
    const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = tpl.w * S; cv.height = tpl.h * S;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      cv.toBlob((b) => { if (!b) { toast('画像にできませんでした'); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'sekai-iro-' + tpl.id + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('画像にできませんでした'); };
    img.src = url;
  }
  function initTryon() {
    if (!CONFIG.fileSave) $('#ty-png').hidden = true;
    $('#ty-tpls').addEventListener('click', (e) => { const b = e.target.closest('[data-tpl]'); if (b) { ty.tpl = b.dataset.tpl; tyRefresh(); } });
    $('#ty-scheme').addEventListener('change', (e) => { const s = SBY[e.target.value]; if (s) { tyLoadScheme(s); tyRefresh(); } });
    $('#ty-fav').addEventListener('click', () => {
      if (!favList.length) { toast('マイパレットが空です。色のカードのハートで、色を集めてください'); return; }
      const ids = favList.slice(-8); tyCustom(ids.map((id, i) => ({ hex: byId[id].hex, w: ids.length - i, name: byId[id].name, id }))); tyRefresh();
    });
    $('#ty-random').addEventListener('click', () => {
      const scoped = SCHEMES.filter((s) => inScope(s, state.region)); const pool = scoped.length ? scoped : SCHEMES;
      let s = pool[Math.floor(Math.random() * pool.length)]; if (pool.length > 1 && s.id === ty.srcId) s = pool[(pool.indexOf(s) + 1) % pool.length];
      tyLoadScheme(s); tyRefresh();
    });
    $('#ty-pal').addEventListener('click', (e) => {
      const rm = e.target.closest('[data-tyrm]');
      if (rm) { const i = +rm.dataset.tyrm; const hex = ty.pal[i].hex; tyCustom(ty.pal.filter((p, k) => k !== i).map((p) => ({ hex: p.hex, w: p.w, name: p.name, id: p.id }))); if (ty.brush === hex) ty.brush = null; tyRefresh(); return; }
      const sw = e.target.closest('[data-tycol]'); if (!sw) return;
      const hex = ty.pal[+sw.dataset.tycol].hex;
      ty.brush = ty.brush === hex ? null : hex;
      if (ty.brush && ty.sel) tyPaint(ty.sel, ty.brush);
      tyRefresh();
    });
    const colorIn = $('#ty-color'), hexIn = $('#ty-hex');
    colorIn.addEventListener('input', () => { hexIn.value = colorIn.value.toUpperCase(); });
    hexIn.addEventListener('input', () => { const n = normHex(hexIn.value); if (n) colorIn.value = n.toLowerCase(); });
    $('#ty-addbtn').addEventListener('click', () => {
      const n = normHex(hexIn.value); if (!n) { toast('HEXは #RRGGBB の形で入力してください'); return; }
      if (ty.pal.length >= 8) { toast('色は8色までです'); return; }
      const base = ty.pal.map((p) => ({ hex: p.hex, w: p.w, name: p.name, id: p.id })); const keepOver = ty.over, keepSel = ty.sel;
      tyCustom(base.concat([{ hex: n, w: 1, name: '', id: '' }])); ty.over = keepOver; ty.sel = keepSel; ty.brush = n; if (ty.sel) tyPaint(ty.sel, n); tyRefresh();
    });
    const pick = (id) => { if (id) tySelect(id); };
    $('#ty-slots').addEventListener('click', (e) => { const b = e.target.closest('[data-slot]'); if (b) pick(b.dataset.slot); });
    $('#ty-stage').addEventListener('click', (e) => { const g = e.target.closest('[data-slot]'); if (g) pick(g.dataset.slot); });
    $('#ty-shift').addEventListener('click', () => { ty.shift = (ty.shift + 1) % Math.max(1, ty.pal.length); ty.over = {}; ty.plain = false; tyRefresh(); });
    $('#ty-shuffle').addEventListener('click', () => {
      const n = ty.pal.length; const p = [...Array(n).keys()];
      for (let k = 0; k < 4; k++) { for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; } if (n < 2 || p.some((v, i) => v !== i)) break; }
      ty.perm = p; ty.shift = 0; ty.over = {}; ty.plain = false; tyRefresh();
    });
    $('#ty-plain').addEventListener('click', () => { ty.plain = !ty.plain; tyRefresh(); });
    $('#ty-copy').addEventListener('click', () => {
      const tpl = TPL[ty.tpl], c = tyColors();
      copyText(tpl.cat + '(' + tpl.label + ')\n' + tpl.slots.map((s) => s.label + ': ' + (c[s.id] || '-')).join('\n'), '配色をコピーしました');
    });
    $('#ty-png').addEventListener('click', tySvgToPng);
    $('#ty-cycle').addEventListener('click', () => { ty.cycle++; tyRefresh(); });
    $('#ty-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-tyscheme]'); if (b) { tyLoadScheme(SBY[b.dataset.tyscheme]); tyRefresh(); } });
  }
  function initTabs() {
    const tabs = $('#tabs');
    tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-page]'); if (b && b.dataset.page !== state.page) setState({ page: b.dataset.page }); });
    tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const order = ['colors', 'schemes', 'tryon']; const i = order.indexOf(state.page);
      const next = order[(i + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
      e.preventDefault(); setState({ page: next }); const nb = $('[data-page="' + next + '"]', tabs); if (nb) nb.focus();
    });
  }

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

    // 複数の地域を表示しているときは、輪郭の色で地域を示し、下に凡例を出す
    const inView = REGIONS.filter((r) => visible.some((c) => c.region === r.id));
    const byRegion = inView.length > 1;
    $('#map-legend').innerHTML = byRegion ? inView.map((r) => '<li><i style="--rc:' + r.color + '"></i>' + r.label + '</li>').join('') : '';
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
    const rank = rankAll(c.lab, c.id);
    const crossAll = bestPerRegion(rank, c.region, 1);
    const crossHTML = (m) => { const q = closeness(m.d); return miniHTML(m.c, q[0], q[1]); };
    const TOP = 6;
    const cross = '<div class="list-mini">' + crossAll.slice(0, TOP).map(crossHTML).join('') + '</div>' +
      (crossAll.length > TOP ? '<details class="more"><summary>ほかの ' + (crossAll.length - TOP) + ' 地域も見る</summary><div class="list-mini">' + crossAll.slice(TOP).map(crossHTML).join('') + '</div></details>' : '');
    const same = rank.filter((m) => m.c.region === c.region).slice(0, 4).map((m) => miniHTML(m.c, '')).join('');
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
      '<div class="sec"><h3>他の文化では？ <small>最も近い色</small></h3>' + cross +
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
    const rank = rankAll(lab), best = rank[0], br = RBY[best.c.region], q = closeness(best.d);
    const col = (r) => '<div class="f-col"><h3><span class="dot" style="--rc:' + r.color + '"></span>' + r.label + '</h3><div class="list-mini">' +
      rank.filter((m) => m.c.region === r.id).slice(0, 2).map((m) => { const k = closeness(m.d); return miniHTML(m.c, k[0], k[1]); }).join('') + '</div></div>';
    const cols = GROUPS.map((g) => '<section class="f-group"><h3 class="f-gh">' + g.label + '</h3><div class="f-cols">' +
      REGIONS.filter((r) => r.group === g.id).map(col).join('') + '</div></section>').join('');
    $('#f-results').innerHTML =
      '<div class="f-best"><div class="f-pair"><div style="background:' + finderHex + ';color:' + tx + '">あなたの色<br>' + finderHex + '</div><div style="background:' + best.c.hex + ';color:' + best.c.text + '">最も近い色<br>' + best.c.hex + '</div></div>' +
      '<div class="f-meta"><span class="hint">' + REGIONS.length + 'の文化の中で最も近いのは</span><b ' + nameAttrs(best.c) + '>' + esc(best.c.name) + '</b>' +
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
    $('#rg-intro').addEventListener('click', (e) => { const b = e.target.closest('[data-region]'); if (b) setState({ region: b.dataset.region }); });
    $('#family-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-family]'); if (b) setState({ family: state.family === b.dataset.family ? 'all' : b.dataset.family }); });
    $('#tag-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-tag]'); if (b) setState({ tag: state.tag === b.dataset.tag ? 'all' : b.dataset.tag }); });
    $('#view-seg').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setState({ view: b.dataset.view }); });
    $('#sort').addEventListener('change', (e) => setState({ sort: e.target.value }));
    let qt; $('#q').addEventListener('input', (e) => { clearTimeout(qt); const v = e.target.value; qt = setTimeout(() => setState({ q: v.trim() }), 120); });
    $('#reset').addEventListener('click', resetAll);
    $('#empty-reset').addEventListener('click', resetAll);
    $('#more').addEventListener('click', loadMore);
    if ('IntersectionObserver' in window) {
      // 「さらに表示」の位置が画面の近くに来たら、続きを足す(ボタンは、使えない環境と読み上げ用に残す)
      new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) loadMore(); }, { rootMargin: '900px 0px' }).observe($('#more-wrap'));
    }
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
    $('#n-regions').textContent = REGIONS.length;
    $('#f-lead').textContent = '好きな色を選ぶと、' + REGIONS.length + 'の文化それぞれで最も近い伝統色を表示します。';
    readHash();
    buildRegions(); buildChips();
    initList(); initMap(); initDetail(); initFinder(); initPalette(); initDialogs(); initTheme(); initTabs(); initSchemes(); initTryon();
    saveFavs();
    update();
    if (selectedId) { const id = selectedId; selectedId = null; openDetail(id); }
    window.__sekai = { count: ALL.length, state, byId, ty, schemes: SCHEMES, mapPts: () => mapPts, visibleCount: () => visible.length, rendered: () => $$('#grid > li').length, tyColors }; // 検証用フック
  }
  init();
})();
