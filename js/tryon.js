/* 着せ替え用のテンプレート(SVG)
   各テンプレートは、色を割り当てられる「パーツ(slots)」と、色の辞書 c(パーツID → HEX)から SVG を作る draw() を持つ。
   pref は、配色の何番目の色(0=最も比率の大きい色)をまず当てるかの目安。'light' / 'dark' は配色の中で最も明るい/暗い色。 */
(function () {
  'use strict';
  const OUT = 'rgba(45,32,20,.30)';
  const SKIN = '#ead9c6';
  const DARK = '#3d332b';
  const sh = (a) => 'rgba(0,0,0,' + a + ')';
  const hl = (a) => 'rgba(255,255,255,' + a + ')';
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  // パーツ(色を塗り替えられる図形のまとまり)
  const slot = (id, c, inner) => '<g class="sl" data-slot="' + id + '" fill="' + c[id] + '" stroke="' + OUT + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' + inner + '</g>';
  // 線として描くパーツ(持ち手など): 下に輪郭の線を敷く
  const lineSlot = (id, c, d, w) => '<g class="sl" data-slot="' + id + '" fill="none" stroke-linecap="round">' +
    '<path d="' + d + '" stroke="' + OUT + '" stroke-width="' + (w + 3.5) + '"/><path d="' + d + '" stroke="' + c[id] + '" stroke-width="' + w + '"/></g>';

  /* ───── ファッション: コーディネート ───── */
  function drawOutfit(c) {
    return [
      slot('bg', c, '<rect x="0" y="0" width="320" height="560" rx="22" stroke="none"/>'),
      '<ellipse cx="160" cy="538" rx="98" ry="9" fill="' + sh(0.13) + '"/>',
      // ボトムス
      slot('bottom', c, '<path d="M121 300 L160 300 L159 508 L127 508 Z"/><path d="M160 300 L199 300 L193 508 L161 508 Z"/>'),
      '<path d="M160 306 V506" stroke="' + sh(0.16) + '" stroke-width="1.5" fill="none"/><rect x="121" y="298" width="78" height="11" rx="3" fill="' + hl(0.2) + '"/>',
      // 靴
      slot('shoes', c, '<path d="M126 506 L159 506 L161 534 Q142 543 114 536 Q114 520 126 506 Z"/><path d="M161 506 L194 506 Q206 520 206 536 Q178 543 160 534 Z"/>'),
      '<path d="M118 532 Q140 539 160 531 M160 531 Q180 539 202 532" stroke="' + hl(0.45) + '" stroke-width="2" fill="none"/>',
      // 首・頭
      '<rect x="150" y="98" width="20" height="32" rx="8" fill="' + SKIN + '" stroke="' + OUT + '" stroke-width="1.6"/>',
      '<circle cx="134" cy="82" r="5.5" fill="' + SKIN + '" stroke="' + OUT + '" stroke-width="1.4"/><circle cx="186" cy="82" r="5.5" fill="' + SKIN + '" stroke="' + OUT + '" stroke-width="1.4"/>',
      '<circle cx="160" cy="78" r="26" fill="' + SKIN + '" stroke="' + OUT + '" stroke-width="1.6"/>',
      // インナー
      slot('inner', c, '<path d="M137 124 Q160 142 183 124 L188 310 L132 310 Z"/>'),
      '<path d="M148 122 L172 122 L160 148 Z" fill="' + SKIN + '"/>',
      // 上着(袖→身頃の順に重ねる)
      slot('jacket', c,
        '<path d="M110 130 L92 144 Q80 216 76 298 L104 304 Q112 224 122 156 Z"/>' +
        '<path d="M210 130 L228 144 Q240 216 244 298 L216 304 Q208 224 198 156 Z"/>' +
        '<path d="M108 130 Q124 118 146 124 L152 312 L112 318 Q104 224 108 130 Z"/>' +
        '<path d="M212 130 Q196 118 174 124 L168 312 L208 318 Q216 224 212 130 Z"/>'),
      '<path d="M146 124 L153 158 L134 142 Z" fill="' + hl(0.3) + '"/><path d="M174 124 L167 158 L186 142 Z" fill="' + hl(0.3) + '"/>',
      '<path d="M116 262 H142 M178 262 H204" stroke="' + sh(0.2) + '" stroke-width="2" fill="none"/><circle cx="154" cy="206" r="3" fill="' + sh(0.3) + '"/><circle cx="154" cy="240" r="3" fill="' + sh(0.3) + '"/>',
      // 手
      '<ellipse cx="90" cy="310" rx="10" ry="13" fill="' + SKIN + '" stroke="' + OUT + '" stroke-width="1.5"/><ellipse cx="230" cy="310" rx="10" ry="13" fill="' + SKIN + '" stroke="' + OUT + '" stroke-width="1.5"/>',
      // スカーフ
      slot('scarf', c, '<path d="M131 118 Q160 140 189 118 L193 134 Q160 158 127 134 Z"/><path d="M168 140 L192 138 L186 228 L164 222 Z"/>'),
      '<path d="M171 172 L190 170 M169 196 L188 194" stroke="' + hl(0.4) + '" stroke-width="3" fill="none"/>',
      // 帽子
      slot('hat', c, '<path d="M124 64 Q120 36 160 34 Q202 32 198 62 Q198 74 188 76 Q160 68 132 76 Q124 74 124 64 Z"/><circle cx="160" cy="30" r="4.5"/>'),
      '<path d="M134 70 Q160 62 188 70" stroke="' + sh(0.14) + '" stroke-width="2" fill="none"/>',
      // バッグ
      slot('bag', c,
        '<path d="M206 132 Q268 172 266 254" fill="none" stroke="' + OUT + '" stroke-width="9"/>' +
        '<path d="M206 132 Q268 172 266 254" fill="none" stroke="' + c.bag + '" stroke-width="6"/>' +
        '<rect x="236" y="252" width="62" height="56" rx="10"/>'),
      '<path d="M238 260 H296 V278 Q267 290 238 278 Z" fill="' + sh(0.1) + '"/><circle cx="267" cy="282" r="4" fill="' + hl(0.55) + '"/>'
    ].join('');
  }

  /* ───── インテリア: リビング ───── */
  function drawRoom(c) {
    return [
      slot('wall', c, '<rect x="0" y="0" width="480" height="262" stroke="none"/>'),
      slot('floor', c, '<rect x="0" y="262" width="480" height="98" stroke="none"/>'),
      '<rect x="0" y="254" width="480" height="10" fill="' + hl(0.4) + '"/><path d="M0 286 H480 M0 310 H480 M0 336 H480 M110 262 V286 M300 286 V310 M60 310 V336 M360 310 V336" stroke="' + sh(0.08) + '" stroke-width="1.5" fill="none"/>',
      // 窓
      '<rect x="48" y="44" width="100" height="152" rx="3" fill="#e6eff5" stroke="' + OUT + '" stroke-width="1.8"/><path d="M98 44 V196 M48 120 H148" stroke="' + OUT + '" stroke-width="1.8" fill="none"/><path d="M58 54 L90 54 L58 100 Z" fill="' + hl(0.55) + '"/>',
      // カーテン
      slot('curtain', c, '<path d="M20 28 H76 V214 Q48 224 20 214 Z"/><path d="M120 28 H176 V214 Q148 224 120 214 Z"/>'),
      '<path d="M33 32 V212 M47 32 V220 M62 32 V212 M133 32 V212 M148 32 V220 M163 32 V212" stroke="' + sh(0.11) + '" stroke-width="2" fill="none"/>',
      '<path d="M10 28 H186" stroke="' + DARK + '" stroke-width="5" stroke-linecap="round"/><circle cx="10" cy="28" r="5" fill="' + DARK + '"/><circle cx="186" cy="28" r="5" fill="' + DARK + '"/>',
      // 壁のアート
      '<rect x="236" y="44" width="124" height="92" rx="3" fill="#f6f1e8" stroke="' + OUT + '" stroke-width="2"/>',
      slot('art', c, '<rect x="248" y="56" width="100" height="68"/>'),
      '<circle cx="282" cy="84" r="15" fill="' + hl(0.5) + '"/><path d="M248 124 L292 96 L320 112 L348 92 L348 124 Z" fill="' + sh(0.2) + '"/>',
      // フロアランプ
      '<rect x="424" y="112" width="5" height="192" fill="' + DARK + '"/><ellipse cx="426.5" cy="304" rx="22" ry="6" fill="' + DARK + '"/>',
      slot('lamp', c, '<path d="M398 120 L412 74 L442 74 L456 120 Z"/>'),
      '<ellipse cx="427" cy="121" rx="29" ry="7" fill="' + hl(0.2) + '" stroke="none"/>',
      // ラグ
      slot('rug', c, '<ellipse cx="240" cy="322" rx="180" ry="30"/>'),
      '<ellipse cx="240" cy="322" rx="148" ry="22" fill="none" stroke="' + hl(0.5) + '" stroke-width="3"/><ellipse cx="240" cy="322" rx="112" ry="15" fill="none" stroke="' + sh(0.12) + '" stroke-width="2"/>',
      // ソファ
      '<ellipse cx="246" cy="285" rx="134" ry="9" fill="' + sh(0.15) + '"/><rect x="150" y="268" width="9" height="15" rx="2" fill="' + DARK + '"/><rect x="332" y="268" width="9" height="15" rx="2" fill="' + DARK + '"/>',
      slot('sofa', c, '<rect x="140" y="166" width="212" height="76" rx="20"/><rect x="128" y="212" width="236" height="56" rx="14"/><rect x="112" y="186" width="36" height="84" rx="16"/><rect x="344" y="186" width="36" height="84" rx="16"/>'),
      '<path d="M146 240 H350" stroke="' + sh(0.14) + '" stroke-width="2" fill="none"/><path d="M211 172 V210 M282 172 V210" stroke="' + sh(0.12) + '" stroke-width="2" fill="none"/>',
      slot('cushion', c, '<rect x="160" y="184" width="50" height="50" rx="11" transform="rotate(-9 185 209)"/><rect x="292" y="186" width="50" height="50" rx="11" transform="rotate(8 317 211)"/>'),
      '<path d="M170 200 L200 196 M172 214 L202 210" stroke="' + hl(0.4) + '" stroke-width="3" fill="none"/><path d="M302 200 L332 204 M300 214 L330 218" stroke="' + hl(0.4) + '" stroke-width="3" fill="none"/>',
      // 観葉植物
      slot('plant', c, '<ellipse cx="52" cy="268" rx="9" ry="28" transform="rotate(-25 52 296)"/><ellipse cx="64" cy="258" rx="9" ry="32"/><ellipse cx="76" cy="268" rx="9" ry="28" transform="rotate(25 76 296)"/>'),
      slot('vase', c, '<path d="M42 298 L84 298 L78 340 L48 340 Z"/>'),
      '<path d="M44 306 H82" stroke="' + hl(0.4) + '" stroke-width="3" fill="none"/>'
    ].join('');
  }

  /* ───── 小物: トート・マグ・ノート ───── */
  function drawGoods(c) {
    return [
      slot('desk', c, '<rect x="0" y="0" width="480" height="360" rx="22" stroke="none"/>'),
      '<path d="M0 70 H480 M0 150 H480 M0 232 H480 M0 318 H480" stroke="' + sh(0.045) + '" stroke-width="2" fill="none"/><rect x="0" y="0" width="480" height="90" rx="22" fill="' + hl(0.12) + '"/>',
      // トートバッグ
      '<ellipse cx="116" cy="302" rx="94" ry="9" fill="' + sh(0.14) + '"/>',
      lineSlot('handle', c, 'M74 122 C74 36 158 36 158 122', 8),
      slot('bag', c, '<path d="M36 118 H196 L190 292 Q116 304 42 292 Z"/>'),
      '<rect x="38" y="118" width="156" height="14" fill="' + sh(0.1) + '"/><path d="M68 200 H164 V262 H68 Z" fill="' + sh(0.08) + '" stroke="' + sh(0.2) + '" stroke-width="1.5"/><path d="M73 205 H159" stroke="' + hl(0.55) + '" stroke-width="2" stroke-dasharray="5 4" fill="none"/>',
      // ノート
      '<g transform="rotate(7 400 130)">' +
        '<rect x="440" y="46" width="9" height="140" rx="2" fill="#f4efe4" stroke="' + OUT + '" stroke-width="1.5"/>' +
        slot('notebook', c, '<rect x="346" y="40" width="98" height="150" rx="7"/>') +
        '<rect x="346" y="40" width="12" height="150" rx="6" fill="' + sh(0.14) + '"/>' +
        '<rect x="366" y="70" width="58" height="34" rx="3" fill="' + hl(0.55) + '" stroke="' + sh(0.12) + '" stroke-width="1.2"/><path d="M372 82 H414 M372 93 H400" stroke="' + sh(0.25) + '" stroke-width="2" fill="none"/>' +
        slot('band', c, '<rect x="418" y="40" width="12" height="150"/>') +
      '</g>',
      // マグカップ
      '<ellipse cx="290" cy="288" rx="66" ry="8" fill="' + sh(0.14) + '"/>',
      slot('mug', c,
        '<path d="M338 198 C384 192 388 262 336 258" fill="none" stroke="' + OUT + '" stroke-width="15"/>' +
        '<path d="M338 198 C384 192 388 262 336 258" fill="none" stroke="' + c.mug + '" stroke-width="11"/>' +
        '<path d="M232 176 H344 L336 272 Q288 288 240 272 Z"/>'),
      '<ellipse cx="288" cy="176" rx="56" ry="11" fill="' + sh(0.3) + '" stroke="' + OUT + '" stroke-width="1.5"/><ellipse cx="288" cy="178" rx="47" ry="8" fill="#4a2f1f"/><ellipse cx="274" cy="176" rx="14" ry="2.5" fill="' + hl(0.25) + '"/>',
      slot('mugband', c, '<path d="M236 212 Q288 226 340 212 L338 236 Q288 250 238 236 Z"/>'),
      // ペン
      '<g transform="rotate(-10 300 318)">' + slot('pen', c, '<rect x="170" y="306" width="206" height="13" rx="6.5"/>') +
        '<path d="M376 306 L397 312.5 L376 319 Z" fill="' + DARK + '" stroke="' + OUT + '" stroke-width="1.2"/><rect x="182" y="303" width="40" height="5" rx="2" fill="' + hl(0.55) + '" stroke="none"/></g>'
    ].join('');
  }

  const templates = [
    { id: 'outfit', cat: 'ファッション', label: 'コーディネート', w: 320, h: 560, draw: drawOutfit, slots: [
      { id: 'bg', label: '背景', pref: 'light' }, { id: 'jacket', label: '上着', pref: 0 }, { id: 'inner', label: 'インナー', pref: 2, vs: ['jacket'] },
      { id: 'bottom', label: 'パンツ', pref: 1, vs: ['jacket'] }, { id: 'hat', label: '帽子', pref: 3, vs: ['jacket'] }, { id: 'scarf', label: 'スカーフ', pref: 2, vs: ['jacket', 'inner'] },
      { id: 'shoes', label: '靴', pref: 'dark', vs: ['bottom'] }, { id: 'bag', label: 'バッグ', pref: 3, vs: ['jacket'] }] },
    { id: 'room', cat: 'インテリア', label: 'リビング', w: 480, h: 360, draw: drawRoom, slots: [
      { id: 'wall', label: '壁', pref: 0 }, { id: 'floor', label: '床', pref: 'dark' }, { id: 'rug', label: 'ラグ', pref: 2, vs: ['floor'] },
      { id: 'sofa', label: 'ソファ', pref: 1, vs: ['wall', 'rug'] }, { id: 'cushion', label: 'クッション', pref: 3, vs: ['sofa'] }, { id: 'curtain', label: 'カーテン', pref: 2, vs: ['wall'] },
      { id: 'art', label: '壁のアート', pref: 3, vs: ['wall'] }, { id: 'lamp', label: 'ランプ', pref: 2, vs: ['wall'] }, { id: 'plant', label: '植物', pref: 1, vs: ['wall'] }, { id: 'vase', label: '鉢', pref: 3, vs: ['floor', 'plant'] }] },
    { id: 'goods', cat: '小物', label: 'トート・マグ・ノート', w: 480, h: 360, draw: drawGoods, slots: [
      { id: 'desk', label: '机', pref: 'light' }, { id: 'bag', label: 'トートバッグ', pref: 0 }, { id: 'handle', label: '持ち手', pref: 'dark', vs: ['bag'] },
      { id: 'mug', label: 'マグカップ', pref: 1 }, { id: 'mugband', label: 'マグの帯', pref: 2, vs: ['mug'] }, { id: 'notebook', label: 'ノート', pref: 3 },
      { id: 'band', label: 'ゴムバンド', pref: 0, vs: ['notebook'] }, { id: 'pen', label: 'ペン', pref: 2 }] }
  ];

  const PLAIN = '#e9e5de';
  // colors: パーツID → HEX。足りないパーツは、プレーンな灰色で描く
  function svg(tpl, colors, o) {
    o = o || {};
    const c = {};
    tpl.slots.forEach((s) => { c[s.id] = (colors && colors[s.id]) || PLAIN; });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tpl.w + ' ' + tpl.h + '" class="ty-svg"' +
      (o.label ? ' role="img" aria-label="' + esc(o.label) + '"' : ' aria-hidden="true"') + '>' + tpl.draw(c) + '</svg>';
  }

  window.SEKAI_TRYON = { templates: templates, svg: svg, PLAIN: PLAIN };
})();
