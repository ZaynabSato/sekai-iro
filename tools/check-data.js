/* データと色計算の検証:  node tools/check-data.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const CU = require('../js/color-utils.js');

const REGIONS = ['jp', 'eu', 'cn', 'in', 'ir', 'naf', 'waf', 'eaf', 'saf', 'mes', 'and', 'nam', 'tro'];
const TAGS = new Set('fmdantgc'.split(''));
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const r of REGIONS) {
  const file = path.join(__dirname, '..', 'js', 'data', r + '.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}
const SEKAI = sandbox.window.SEKAI;

let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ✗ ' + m); };
const warn = (m) => { warns++; console.log('  ! ' + m); };

console.log('== 形式チェック ==');
let total = 0;
for (const r of REGIONS) {
  const list = SEKAI[r];
  if (!Array.isArray(list)) { err(r + ': 配列がない'); continue; }
  const names = new Map(), hexes = new Map();
  list.forEach((c, i) => {
    const tag = `${r}[${i}] ${c && c[0]}`;
    if (!Array.isArray(c) || c.length !== 6) return err(tag + ': 項目数が6ではない');
    c.forEach((v, k) => { if (typeof v !== 'string') err(`${tag}: 項目${k}が文字列でない`); });
    if (!c[0].trim()) err(tag + ': 名前が空');
    if (r !== 'eu' && !c[1].trim()) err(tag + ': 読みが空');
    if (!c[2].trim()) err(tag + ': ローマ字が空');
    if (!CU.HEX_RE.test(c[3])) err(tag + ': HEXが不正 ' + c[3]);
    if (!c[4].trim()) err(tag + ': 解説が空');
    if (!TAGS.has(c[5])) err(tag + ': テーマ記号が不正 ' + c[5]);
    const nk = c[0] + '|' + c[2];
    if (names.has(nk)) err(`${tag}: 名前+ローマ字の重複 (行 ${names.get(nk)})`); else names.set(nk, i);
    const hk = c[3].toUpperCase();
    if (hexes.has(hk)) warn(`${r}: 同一HEX ${hk}: 「${list[hexes.get(hk)][0]}」と「${c[0]}」`); else hexes.set(hk, i);
  });
  total += list.length;
  console.log(`  ${r}: ${list.length}色`);
}
console.log(`  合計: ${total}色`);

console.log('\n== 色計算のテスト ==');
function approx(a, b, eps, label) {
  if (Math.abs(a - b) > eps) err(`${label}: 期待 ${b} / 実際 ${a}`); else console.log(`  ✓ ${label}`);
}
// CIEDE2000 の公開テストデータ (Sharma et al. 2005)
approx(CU.deltaE([50, 2.6772, -79.7751], [50, 0, -82.7485]), 2.0425, 0.001, 'ΔE00 Sharma #1');
approx(CU.deltaE([50, 3.1571, -77.2803], [50, 0, -82.7485]), 2.8615, 0.001, 'ΔE00 Sharma #2');
approx(CU.deltaE([50, 2.5, 0], [73, 25, -18]), 27.1492, 0.001, 'ΔE00 Sharma #17');
approx(CU.deltaE([60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387]), 1.2644, 0.001, 'ΔE00 Sharma #31');
const white = CU.rgbToLab(255, 255, 255);
approx(white[0], 100, 0.01, 'Lab(白) L=100');
approx(CU.contrast([0, 0, 0], [255, 255, 255]), 21, 0.01, 'コントラスト比 黒/白=21');
const hsl = CU.rgbToHsl(...CU.hexToRgb('#FF9933'));
approx(hsl[0], 30, 0.1, 'HSL色相 #FF9933=30°');
const back = CU.hslToRgb(...CU.rgbToHsl(200, 100, 50));
approx(back[0] + back[1] * 0.001 + back[2] * 0.000001, 200.1000500, 0.01, 'HSL往復変換');
if (CU.normalize('ブルー') !== CU.normalize('ぶるー')) err('カナ正規化'); else console.log('  ✓ カタカナ=ひらがな正規化');
if (CU.normalize("Fīrūzeh'ī") !== 'firuzehi') err('ダイアクリティカル正規化: ' + CU.normalize("Fīrūzeh'ī")); else console.log('  ✓ ローマ字の長音記号・アポストロフィ吸収');

console.log('\n== 系統判定の分布 ==');
const FAM = { pink: '桃', red: '赤', orange: '橙', yellow: '黄', green: '緑', blue: '青', purple: '紫', brown: '茶', mono: '白黒' };
const dist = {};
for (const r of REGIONS) {
  dist[r] = {};
  for (const c of SEKAI[r]) { const f = CU.classify(c[3]); dist[r][f] = (dist[r][f] || 0) + 1; }
}
console.log('      ' + Object.keys(FAM).map((k) => FAM[k].padStart(3)).join(' '));
for (const r of REGIONS) console.log(`  ${r}  ` + Object.keys(FAM).map((k) => String(dist[r][k] || 0).padStart(3)).join(' '));

console.log('\n== 系統判定の目視用サンプル (名前の印象と合っているか) ==');
const probe = ['桜色', '紅', '朱色', '茶色', '鼠色', '月白', '象牙色', '山吹色', '藍色', 'ウルトラマリン', 'ティリアンパープル', 'セピア', 'केसरी', 'فیروزه‌ای', '朱砂', '黛', '漢白玉', '琥珀', '蘇芳',
  'أزرق شفشاون', 'زعفران', 'Kente', 'Bògòlanfini', 'Shanga nyekundu', 'Otjize', 'Rosa mexicano', 'Nocheztli', 'Mullu', 'Sleeping Beauty Turquoise', 'Bayeta Red', 'Urucum', 'Oxum'];
for (const r of REGIONS) for (const c of SEKAI[r]) {
  if (probe.includes(c[0]) || probe.includes(c[0].replace(/‌/g, '‌'))) console.log(`  ${r} ${c[0]} ${c[3]} → ${FAM[CU.classify(c[3])]}系`);
}

console.log(`\n結果: エラー ${errors} / 注意 ${warns}`);
process.exit(errors ? 1 : 0);
