/* 色空間まわりの純粋関数。ブラウザ(window.ColorUtils)とNode(require)の両方で使える。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ColorUtils = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HEX_RE = /^#[0-9A-Fa-f]{6}$/;

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    function h(v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }
    return ('#' + h(r) + h(g) + h(b)).toUpperCase();
  }

  /** @returns {[number, number, number]} h:0-360, s:0-1, l:0-1 */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var l = (max + min) / 2, h = 0, s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  /** 単純変換によるCMYK(%)。印刷用の正確な値ではなく目安。 */
  function rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var k = 1 - Math.max(r, g, b);
    if (k >= 1) return [0, 0, 0, 100];
    return [(1 - r - k) / (1 - k) * 100, (1 - g - k) / (1 - k) * 100, (1 - b - k) / (1 - k) * 100, k * 100].map(Math.round);
  }

  function rgbToLab(r, g, b) {
    function lin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    var R = lin(r), G = lin(g), B = lin(b);
    var X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
    var Y = (0.2126729 * R + 0.7151522 * G + 0.0721750 * B);
    var Z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883;
    function f(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
    var fx = f(X), fy = f(Y), fz = f(Z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  /** CIEDE2000 色差。値が小さいほど近い(1前後=ほぼ同じ、10前後=はっきり違う)。 */
  function deltaE(l1, l2) {
    var L1 = l1[0], a1 = l1[1], b1 = l1[2], L2 = l2[0], a2 = l2[1], b2 = l2[2];
    var rad = Math.PI / 180, deg = 180 / Math.PI;
    var C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
    var G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
    var a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    var C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    var h1p = (Math.atan2(b1, a1p) * deg + 360) % 360, h2p = (Math.atan2(b2, a2p) * deg + 360) % 360;
    if (C1p === 0) h1p = 0; if (C2p === 0) h2p = 0;
    var dL = L2 - L1, dC = C2p - C1p, dh = 0;
    if (C1p * C2p !== 0) {
      dh = h2p - h1p;
      if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
    }
    var dH = 2 * Math.sqrt(C1p * C2p) * Math.sin(dh * rad / 2);
    var Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2, hbp;
    if (C1p * C2p === 0) hbp = h1p + h2p;
    else if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
    else hbp = (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2;
    var T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.20 * Math.cos((4 * hbp - 63) * rad);
    var dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
    var Rc = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
    var Sl = 1 + 0.015 * Math.pow(Lbp - 50, 2) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
    var Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
    var Rt = -Math.sin(2 * dTheta * rad) * Rc;
    return Math.sqrt(Math.pow(dL / Sl, 2) + Math.pow(dC / Sc, 2) + Math.pow(dH / Sh, 2) + Rt * (dC / Sc) * (dH / Sh));
  }

  function luminance(r, g, b) {
    function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function contrast(rgbA, rgbB) {
    var a = luminance(rgbA[0], rgbA[1], rgbA[2]), b = luminance(rgbB[0], rgbB[1], rgbB[2]);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  /** 背景色に載せる文字色(黒/白)のうち、コントラストが高い方 */
  function readableText(rgb) {
    return contrast(rgb, [255, 255, 255]) >= contrast(rgb, [20, 18, 16]) ? '#FFFFFF' : '#141210';
  }

  /** 系統(色相タブ)の自動判定: pink red orange yellow green blue purple brown mono */
  function classify(hex) {
    var rgb = hexToRgb(hex), lab = rgbToLab(rgb[0], rgb[1], rgb[2]), hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    var L = lab[0], C = Math.hypot(lab[1], lab[2]), h = hsl[0];
    var pinkish = h >= 335 || h < 28;
    if (L < 12) return 'mono';
    if (C < 9 && !(pinkish && L > 88 && C >= 4.5)) return 'mono';
    if (L > 88 && C < 14 && !pinkish) return 'mono';
    if (h >= 300 && h < 345) {
      if (L >= 50 || (h >= 320 && h < 332 && C >= 60)) return 'pink'; // 彩度の高いマゼンタは、明度が低めでも桃とみなす
      return h < 330 ? 'purple' : 'red';
    }
    if (h >= 345 || h < 15) {
      if (L >= 72) return 'pink';
      if (h < 15 && h >= 8 && L < 42) return 'brown';
      return 'red';
    }
    if (h < 42) {
      if (h < 25 && L >= 80) return 'pink';
      if (L < 42) return 'brown';
      if (h >= 25 && L < 50) return 'brown';
      if (h >= 25 && C < 40 && L < 88) return 'brown';
      return 'orange';
    }
    if (h < 70) {
      if (L < 50) return h < 56 ? 'brown' : 'green';
      return 'yellow';
    }
    if (h < 165) return 'green';
    if (h < 232) return 'blue';
    if (h < 255) {
      // 青と紫の境目: 淡い藤色や灰みの青紫は紫系として扱う
      if ((L >= 70 && C < 30) || (h >= 245 && C < 25)) return 'purple';
      return 'blue';
    }
    return 'purple'; // 255〜300
  }

  /** 検索用の正規化: 全半角・ダイアクリティカルマーク・大小文字・かな種・記号の違いを吸収する */
  function normalize(s) {
    return String(s == null ? '' : s)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); })
      .replace(/[\s・'’`\-_.,・]/g, '');
  }

  function slug(s) {
    return String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  return {
    HEX_RE: HEX_RE, hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb,
    rgbToCmyk: rgbToCmyk, rgbToLab: rgbToLab, deltaE: deltaE, luminance: luminance, contrast: contrast,
    readableText: readableText, classify: classify, normalize: normalize, slug: slug
  };
});
