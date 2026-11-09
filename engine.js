/* Orbo Muse recommendation engine (pure functions, no DOM). Works in Node and the browser. */
(function (root) {
'use strict';
const CATS = ["Cleanser", "Serum", "Moisturizer", "Sunscreen", "Foundation"];
const CONCERNS = ["acne", "pig", "dull", "age", "dry", "red"];
const TONES = ["#F6E3D0", "#EBCBA8", "#D9A97F", "#C08A5F", "#9C6641", "#744630", "#4F2F22"];
const P = (n, b, c, p, k, t, pop, ing, hex, u) => ({ n, b, c, p, k: k ? k.split(",") : [], t: t.split(","), pop, ing: ing ? ing.split("|") : [], hex, u });
// SYNTHETIC demo catalogue (fictional brands). Replace with a licensed catalogue in production.
const CATALOG = [
  P("Clarity Gel Wash", "Aurelle", "Cleanser", 499, "acne,red", "o,c", .8, "salicylic acid|glycerin"),
  P("Cloud Cream Cleanser", "Maison Lune", "Cleanser", 650, "dry,red", "d,s", .7, "ceramides|glycerin"),
  P("Glow Enzyme Wash", "Veda Lab", "Cleanser", 799, "dull,pig", "c,o,d", .6, "papain|lactic acid"),
  P("Calm Micellar Water", "Maison Lune", "Cleanser", 450, "red,dry", "s,d,c", .75, "glycerin|allantoin"),
  P("Niacinamide 10%", "Veda Lab", "Serum", 599, "acne,pig,red", "o,c", .95, "niacinamide|zinc"),
  P("Vitamin C Radiance", "Aurelle", "Serum", 1299, "dull,pig,age", "c,d,o", .85, "vitamin c|ferulic acid"),
  P("Retinal Night Serum", "Solenne", "Serum", 1899, "age,pig,acne", "c,o,d", .7, "retinal|squalane"),
  P("Hyaluronic Barrier", "Maison Lune", "Serum", 899, "dry,red,age", "d,s,c", .9, "hyaluronic acid|panthenol"),
  P("Azelaic Calm", "Solenne", "Serum", 1099, "red,acne,pig", "s,o,c", .55, "azelaic acid"),
  P("Gel Cream Matte", "Aurelle", "Moisturizer", 699, "acne,dull", "o,c", .7, "niacinamide|glycerin"),
  P("Ceramide Rich Cream", "Maison Lune", "Moisturizer", 1199, "dry,red,age", "d,s", .8, "ceramides|squalane"),
  P("Peptide Night Cream", "Solenne", "Moisturizer", 1799, "age,dull", "d,c", .5, "peptides|bakuchiol"),
  P("Barrier Calm Lotion", "Veda Lab", "Moisturizer", 749, "red,dry", "s,c,d", .65, "panthenol|centella"),
  P("Invisible Fluid SPF50", "Aurelle", "Sunscreen", 799, "pig,age,dull", "o,c", .9, "avobenzone|niacinamide"),
  P("Mineral Shield SPF40", "Maison Lune", "Sunscreen", 999, "red,pig", "s,d,c", .7, "zinc oxide"),
  P("Tinted Glow SPF50", "Solenne", "Sunscreen", 1099, "pig,dull", "d,c,o", .6, "iron oxides|vitamin e"),
  P("Silk Skin 110 Ivory", "Solenne", "Foundation", 1499, "", "d,c,s", .7, "", "#F3DCC6", "cool"),
  P("Silk Skin 220 Sand", "Solenne", "Foundation", 1499, "", "d,c,s", .8, "", "#E3BF9B", "warm"),
  P("Silk Skin 330 Honey", "Solenne", "Foundation", 1499, "", "d,c,s", .8, "", "#CF9E73", "warm"),
  P("Silk Skin 450 Caramel", "Solenne", "Foundation", 1499, "", "d,c,s", .7, "", "#A87450", "warm"),
  P("Silk Skin 570 Espresso", "Solenne", "Foundation", 1499, "", "d,c,s", .6, "", "#6D4430", "neutral"),
  P("Silk Skin 680 Ebony", "Solenne", "Foundation", 1499, "", "d,c,s", .5, "", "#4A2E22", "cool"),
  P("Matte Velvet Sand", "Aurelle", "Foundation", 999, "", "o,c", .8, "", "#E0BC98", "warm"),
  P("Matte Velvet Honey", "Aurelle", "Foundation", 999, "", "o,c", .75, "", "#CB9A70", "neutral"),
  P("Matte Velvet Caramel", "Aurelle", "Foundation", 999, "", "o,c", .7, "", "#A77251", "warm"),
  P("Matte Velvet Cocoa", "Aurelle", "Foundation", 999, "", "o,c", .55, "", "#7A4D36", "neutral")
];

// ---- Colour science: sRGB -> CIELAB (D65) and CIEDE2000 ----
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
function hexToLab(h) {
  const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
  const X = (r * .4124564 + g * .3575761 + b * .1804375) / .95047, Y = r * .2126729 + g * .7151522 + b * .072175, Z = (r * .0193339 + g * .119192 + b * .9503041) / 1.08883;
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
function deltaE00(l1, l2) {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2, rad = Math.PI / 180, deg = 180 / Math.PI, p7 = 25 ** 7;
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2, G = .5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + p7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1 = Math.hypot(a1p, b1), C2 = Math.hypot(a2p, b2);
  const hue = (b, a) => { if (!b && !a) return 0; const x = Math.atan2(b, a) * deg; return x < 0 ? x + 360 : x; };
  const h1 = hue(b1, a1p), h2 = hue(b2, a2p), dL = L2 - L1, dC = C2 - C1;
  let dh = 0; if (C1 * C2) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin(dh * rad / 2), Lb = (L1 + L2) / 2, Cbp = (C1 + C2) / 2;
  let hb = h1 + h2; if (C1 * C2) { if (Math.abs(h1 - h2) > 180) hb += (h1 + h2 < 360 ? 360 : -360); hb /= 2; }
  const T = 1 - .17 * Math.cos((hb - 30) * rad) + .24 * Math.cos(2 * hb * rad) + .32 * Math.cos((3 * hb + 6) * rad) - .2 * Math.cos((4 * hb - 63) * rad);
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2)), Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + p7));
  const Sl = 1 + .015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2), Sc = 1 + .045 * Cbp, Sh = 1 + .015 * Cbp * T, Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

// ---- Ingredient safety ----
const RULES = [
  ["retinal", "vitamin c", "info", "Use vitamin C in the morning and retinal at night."],
  ["retinal", "salicylic acid", "medium", "Retinal with a salicylic-acid cleanser can irritate; use the cleanser on alternate nights."],
  ["retinal", "lactic acid", "medium", "Retinal with an AHA cleanser can over-exfoliate; alternate nights."],
  ["retinal", "azelaic acid", "info", "Azelaic acid and retinal pair well, but introduce one at a time."]
];
const conflicts = (a, b) => RULES.filter(([x, y]) => (a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))).map(([x, y, sev, msg]) => ({ sev, msg }));
const unsafe = (p, u) => u.type === "s" && p.ing.includes("retinal"); // hard exclusion for sensitive skin

// ---- Relevance scoring ----
function score(p, u) {
  const r = { pop: p.pop, type: p.t.includes(u.type) ? 1 : .2, value: 1 - .5 * Math.min(1, p.p / u.bud), budget: p.p <= u.bud ? 1 : Math.max(0, 1 - (p.p - u.bud) / u.bud) };
  if (p.c === "Foundation") {
    r.dE = deltaE00(hexToLab(TONES[u.tone]), hexToLab(p.hex)); r.shade = 1 / (1 + (r.dE / 6) ** 2);
    r.under = p.u === u.under ? 1 : (p.u === "neutral" || u.under === "neutral") ? .6 : .2;
    r.total = .55 * r.shade + .2 * r.under + .12 * r.type + .06 * r.pop + .07 * r.value;
  } else {
    const n = u.con.size; r.concern = n ? p.k.filter(k => u.con.has(k)).length / n : .5;
    r.clim = ({ humid: ["o", "c"], dry: ["d", "s"] }[u.clim] || []).some(t => p.t.includes(t)) ? 1 : 0;
    if (u.clim === "polluted") r.clim = p.k.some(k => k === "dull" || k === "pig") ? 1 : 0;
    r.total = .46 * r.concern + .28 * r.type + .10 * r.pop + .06 * r.clim + .10 * r.value;
  }
  return r;
}

// ---- Diversity re-ranking (Maximal Marginal Relevance) ----
const jac = (a, b) => { const s = new Set([...a, ...b]); return s.size ? a.filter(x => b.includes(x)).length / s.size : 0; };
const sim = (a, b) => .4 * (a.b === b.b) + .4 * jac(a.k, b.k) + .2 * jac(a.t, b.t);
function mmr(items, k, lam) {
  const sel = [], pool = items.slice();
  while (sel.length < k && pool.length) {
    let bi = 0, bv = -9;
    pool.forEach((it, i) => { const v = sel.length ? lam * it.adj - (1 - lam) * Math.max(...sel.map(s => sim(it.p, s.p))) : it.adj; if (v > bv) { bv = v; bi = i; } });
    sel.push(pool.splice(bi, 1)[0]);
  }
  return sel;
}

// ---- Routine-aware ranking with a HARD budget filter ----
function rank(u, opt) {
  opt = Object.assign({ k: 3, lam: .75, stretch: true, stretchPct: .25 }, opt);
  const out = {}, chosen = [], used = {};
  CATS.forEach(c => {
    const all = CATALOG.filter(p => p.c === c && !unsafe(p, u));
    const inB = all.filter(p => p.p <= u.bud), st = all.filter(p => p.p > u.bud && p.p <= u.bud * (1 + opt.stretchPct));
    const mk = (p, flag) => {
      const s = score(p, u); let adj = s.total - .04 * (used[p.b] || 0);
      chosen.forEach(q => conflicts(p.ing, q.ing).forEach(f => { adj -= f.sev === "medium" ? .08 : f.sev === "high" ? .2 : .02; }));
      return { p, s, adj, flag };
    };
    let list = mmr(inB.map(p => mk(p)).sort((a, b) => b.adj - a.adj), opt.k, c === "Foundation" ? 1 : opt.lam);
    if (opt.stretch && list.length < opt.k) list = list.concat(st.map(p => mk(p, "stretch")).sort((a, b) => b.adj - a.adj).slice(0, opt.k - list.length));
    if (!list.length && all.length) { const near = all.filter(p => p.p <= u.bud * 2).map(p => mk(p, "over")).sort((a, b) => b.adj - a.adj); list = [near[0] || mk(all.slice().sort((a, b) => a.p - b.p)[0], "over")]; }
    out[c] = list;
    if (list[0]) { chosen.push(list[0].p); used[list[0].p.b] = (used[list[0].p.b] || 0) + 1; }
  });
  return out;
}
function routineCheck(r) {
  const picks = CATS.map(c => r[c] && r[c][0] && r[c][0].p).filter(Boolean), w = [];
  picks.forEach((a, i) => picks.slice(i + 1).forEach(b => conflicts(a.ing, b.ing).forEach(f => w.push({ sev: f.sev, msg: f.msg, items: [a.n, b.n] }))));
  return w;
}
function popRank(u, k) { // baseline: most popular items within budget
  const o = {}; CATS.forEach(c => { const all = CATALOG.filter(p => p.c === c), inB = all.filter(p => p.p <= u.bud); o[c] = (inB.length ? inB : all.sort((a, b) => a.p - b.p).slice(0, 1)).sort((a, b) => b.pop - a.pop).slice(0, k || 3).map(p => ({ p })); }); return o;
}

// ---- Labelled evaluation set (graded relevance 3=ideal, 2=good, 1=acceptable). Authored by the project owner as demo ground truth. ----
const G = (id, tone, under, type, con, bud, clim, rel) => ({ id, u: { tone, under, type, con: new Set(con.split(",")), bud, clim }, rel });
const GOLD = [
  G("oily-acne-humid", 3, "warm", "o", "acne", 1200, "humid", { "Clarity Gel Wash": 3, "Glow Enzyme Wash": 1, "Niacinamide 10%": 3, "Azelaic Calm": 2, "Gel Cream Matte": 3, "Barrier Calm Lotion": 1, "Invisible Fluid SPF50": 3, "Tinted Glow SPF50": 1, "Matte Velvet Honey": 3, "Matte Velvet Caramel": 2, "Matte Velvet Sand": 1 }),
  G("dry-dehydrated-cold", 1, "cool", "d", "dry,red", 1500, "dry", { "Cloud Cream Cleanser": 3, "Calm Micellar Water": 2, "Hyaluronic Barrier": 3, "Azelaic Calm": 1, "Ceramide Rich Cream": 3, "Barrier Calm Lotion": 2, "Mineral Shield SPF40": 3, "Tinted Glow SPF50": 1, "Silk Skin 220 Sand": 3, "Silk Skin 110 Ivory": 2 }),
  G("sensitive-redness", 4, "neutral", "s", "red", 1200, "any", { "Calm Micellar Water": 3, "Cloud Cream Cleanser": 2, "Azelaic Calm": 3, "Hyaluronic Barrier": 2, "Barrier Calm Lotion": 3, "Ceramide Rich Cream": 2, "Mineral Shield SPF40": 3 }),
  G("aging-pigment-dry", 2, "warm", "d", "age,pig,dull", 2000, "any", { "Glow Enzyme Wash": 2, "Cloud Cream Cleanser": 2, "Vitamin C Radiance": 3, "Retinal Night Serum": 3, "Hyaluronic Barrier": 2, "Peptide Night Cream": 3, "Ceramide Rich Cream": 2, "Tinted Glow SPF50": 3, "Mineral Shield SPF40": 2, "Silk Skin 330 Honey": 3, "Silk Skin 220 Sand": 2 }),
  G("combo-pigment-polluted-900", 5, "neutral", "c", "pig,dull", 900, "polluted", { "Glow Enzyme Wash": 3, "Niacinamide 10%": 3, "Hyaluronic Barrier": 1, "Gel Cream Matte": 2, "Barrier Calm Lotion": 2, "Invisible Fluid SPF50": 3, "Matte Velvet Cocoa": 3, "Matte Velvet Caramel": 1 }),
  G("oily-acne-budget-600", 3, "warm", "o", "acne,pig", 600, "any", { "Clarity Gel Wash": 3, "Calm Micellar Water": 1, "Niacinamide 10%": 3, "Gel Cream Matte": 3, "Invisible Fluid SPF50": 3, "Matte Velvet Honey": 3 }),
  G("mature-dry-fair", 1, "neutral", "d", "age,dry", 1800, "any", { "Cloud Cream Cleanser": 3, "Hyaluronic Barrier": 3, "Vitamin C Radiance": 2, "Peptide Night Cream": 3, "Ceramide Rich Cream": 2, "Tinted Glow SPF50": 2, "Mineral Shield SPF40": 2, "Silk Skin 220 Sand": 3, "Silk Skin 110 Ivory": 2 }),
  G("combo-redness-acne-humid", 2, "warm", "c", "red,acne", 1100, "humid", { "Clarity Gel Wash": 2, "Calm Micellar Water": 2, "Azelaic Calm": 3, "Niacinamide 10%": 3, "Gel Cream Matte": 2, "Barrier Calm Lotion": 2, "Mineral Shield SPF40": 2, "Invisible Fluid SPF50": 2, "Matte Velvet Sand": 3, "Matte Velvet Honey": 2 }),
  G("sensitive-aging-no-retinal", 1, "cool", "s", "age,red", 2000, "any", { "Cloud Cream Cleanser": 3, "Hyaluronic Barrier": 3, "Azelaic Calm": 2, "Barrier Calm Lotion": 2, "Ceramide Rich Cream": 3, "Mineral Shield SPF40": 3, "Silk Skin 110 Ivory": 3, "Silk Skin 220 Sand": 2 })
];
function ndcg(rels, all, k) {
  const dcg = a => a.slice(0, k).reduce((s, g, i) => s + (2 ** g - 1) / Math.log2(i + 2), 0);
  const ideal = dcg(all.slice().sort((a, b) => b - a)); return ideal ? dcg(rels) / ideal : 0;
}
function evaluate(rankFn, k) {
  k = k || 3; const rows = [];
  GOLD.forEach(g => {
    const r = rankFn(g.u);
    CATS.forEach(c => {
      const lab = {}; Object.keys(g.rel).forEach(n => { const p = CATALOG.find(x => x.n === n); if (p && p.c === c) lab[n] = g.rel[n]; });
      const nRel = Object.keys(lab).length; if (!nRel) return;
      const rels = (r[c] || []).slice(0, k).map(x => lab[x.p.n] || 0), hits = rels.filter(x => x > 0).length;
      let ap = 0, h = 0; rels.forEach((x, i) => { if (x > 0) { h++; ap += h / (i + 1); } });
      rows.push({ id: g.id, c, P: hits / k, R: hits / nRel, N: ndcg(rels, Object.values(lab), k), AP: ap / Math.min(nRel, k) });
    });
  });
  const m = key => rows.reduce((s, r) => s + r[key], 0) / rows.length;
  return { rows, P: m("P"), R: m("R"), N: m("N"), AP: m("AP") };
}
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function smoke(n, seed) { // seeded, reproducible stress test
  const rnd = mulberry32(seed), seen = new Set(), now = () => (typeof performance !== "undefined" ? performance : Date).now();
  let viol = 0, tot = 0, ild = 0, ildN = 0, clean = 0, ms = 0;
  for (let i = 0; i < n; i++) {
    const u = { tone: Math.floor(rnd() * 7), under: ["warm", "cool", "neutral"][Math.floor(rnd() * 3)], type: "odcs"[Math.floor(rnd() * 4)], bud: 400 + 100 * Math.floor(rnd() * 17), clim: ["any", "humid", "dry", "polluted"][Math.floor(rnd() * 4)], con: new Set(CONCERNS.filter(() => rnd() < .35)) };
    if (!u.con.size) u.con.add(CONCERNS[Math.floor(rnd() * 6)]);
    const t0 = now(), r = rank(u); ms += now() - t0;
    CATS.forEach(c => { const l = r[c]; if (l[0]) seen.add(l[0].p.n); l.forEach(x => { if (!x.flag) { tot++; if (x.p.p > u.bud) viol++; } }); if (l.length > 1 && c !== "Foundation") { ild += new Set(l.map(x => x.p.b)).size / l.length; ildN++; } });
    if (!routineCheck(r).some(w => w.sev !== "info")) clean++;
  }
  return { budgetViol: viol / tot, coverage: seen.size / CATALOG.length, ild: ild / ildN, clean: clean / n, ms: ms / n };
}
root.Engine = { CATALOG, CATS, TONES, hexToLab, deltaE00, score, rank, routineCheck, popRank, evaluate, smoke, GOLD, mmr, conflicts, mulberry32 };
if (typeof module !== "undefined") module.exports = root.Engine;
})(typeof window !== "undefined" ? window : globalThis);
