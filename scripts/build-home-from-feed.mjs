/**
 * Build data/categories/home.json from the Boxed2me Awin product feed.
 *
 * The feed is the canonical source of in-stock products + their per-product
 * aw_deep_link tracking URLs. Re-run after downloading a fresh feed:
 *   1. Download the Awin "Create-a-Feed" CSV (gzip) to %TEMP%\boxed2me_feed.csv.gz
 *   2. node scripts/build-home-from-feed.mjs
 * The feed URL contains a private API key and is NEVER stored in the repo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const csv = gunzipSync(readFileSync(process.env.TEMP + "\\boxed2me_feed.csv.gz")).toString("utf8");

function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else { if (c === '"') inQ = true; else if (c === ",") { row.push(field); field=""; } else if (c === "\n") { row.push(field); rows.push(row); row=[]; field=""; } else if (c === "\r") {} else field += c; }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(csv);
const h = rows[0]; const data = rows.slice(1).filter(r => r.length === h.length);
const I = (n) => h.indexOf(n);
const NAME=I("product_name"), CAT=I("merchant_category"), PRICE=I("search_price"), LINK=I("aw_deep_link");
const rec = (r) => ({ name: r[NAME], cat: r[CAT], price: parseFloat(r[PRICE]), link: r[LINK] });

const ACCESSORY = /accessor|replacement|spare|\bbag\b|\bbags\b|hose|\bbrush|\bpart|cover|descal|\bfilter\b|nozzle|adapter|cartridge|refill|crevice|holder|rack only/i;
// Filter by the feed's clean merchant_category path (precise), not name keywords.
const inCat = (frag) => (r) =>
  new RegExp(frag, "i").test(r[CAT]) && !ACCESSORY.test(r[NAME]);
const pick = (frag) => data.filter(inCat(frag)).map(rec).sort((a,b)=>a.price-b.price);

// ── Curated selection per coherent appliance type (from live feed) ───────────
// screen_size = the specific appliance type, so the quiz ranks within one type.
const selection = [
  ...pick("Climate Control Appliances > Air Purifiers").slice(0, 2).map(p => ({ ...p, sub: "purifier" })),
  ...pick("Climate Control Appliances > Dehumidifiers").filter(p => p.price >= 35 && /dehumidifier/i.test(p.name)).slice(0, 3).map(p => ({ ...p, sub: "dehumidifier" })),
  ...pick("Climate Control Appliances > Space Heaters").slice(0, 4).map(p => ({ ...p, sub: "heater" })),
  ...pick("Household Appliances > Vacuums").slice(0, 4).map(p => ({ ...p, sub: "vacuum" })),
];

// ── Heuristic scoring from real product attributes ───────────────────────────
const clamp = (n) => Math.max(40, Math.min(99, Math.round(n)));
const band = (p) => p < 35 ? "budget" : p < 80 ? "mid" : p < 150 ? "high" : "premium";
const brandOf = (name) => {
  const m = name.match(/^(Nedis|Prem-?i-?air|Ex-?Pro|Philips|Bosch|Electrolux|Alecto|Russell Hobbs)/i);
  return m ? m[1].replace(/-/g, "").replace(/prem?i?air/i, "Prem-I-Air") : name.split(/[ |]/)[0];
};

const products = selection.map((p, i) => {
  const n = p.name; const price = p.price;
  const has = (re) => re.test(n);
  // gaming = power/capacity
  let gaming = 68 + (price > 150 ? 22 : price > 80 ? 14 : price > 40 ? 6 : 0)
    + (has(/XXL|3kW|2kW|2000\s?W|30\s?l|20\s?l|laser|robot/i) ? 8 : 0);
  // battery = energy efficiency
  let battery = 72 + (has(/energy saving|low power|eco|PTC|inverter|25W|smart/i) ? 12 : 0)
    - (has(/3kW|2000\s?W|2kW/i) ? 14 : 0);
  // productivity = performance / effectiveness
  let prod = 80 + (has(/smart|wi-?fi|HEPA|laser|digital|CADR|presets?/i) ? 10 : 0);
  // portability = compact / ease of use
  let port = 64 + (has(/compact|mini|handheld|cordless|portable|lightweight|window/i) ? 24 : 0)
    - (has(/tower|freestanding|wall-?mount|convection/i) ? 8 : 0);
  // value = inverse price
  let value = 112 - price / 4;
  // Build a clean, distinguishable name: first 2 pipe-segments joined by " · ".
  const segs = n.split("|").map(s => s.trim()).filter(Boolean);
  const cleanName = (segs.length > 1 ? `${segs[0]} · ${segs[1]}` : segs[0])
    .replace(/,\s*$/, "").slice(0, 78).replace(/[ ·,]+$/, "").trim();
  return {
    id: `h${i + 1}`,
    name: cleanName,
    category: p.sub,
    affiliate_url: p.link,
    price_band: band(price),
    battery_score: clamp(battery),
    portability_score: clamp(port),
    gaming_score: clamp(gaming),
    productivity_score: clamp(prod),
    value_score: clamp(value),
    screen_size: p.sub,
    brand: brandOf(n),
  };
});

const out = {
  category: "home",
  scoring_profile: { battery_bonus: 0.12, productivity_bonus: 0.15, value_bonus: 0.18 },
  products,
};
writeFileSync(new URL("../data/categories/home.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");

console.log(`wrote home.json with ${products.length} products`);
const bySub = {};
products.forEach(p => (bySub[p.category] = (bySub[p.category]||[])).push(p));
for (const [s, ps] of Object.entries(bySub)) {
  console.log(`\n${s} (${ps.length}):`);
  ps.forEach(p => console.log(`  £${selection.find(x=>x.link===p.affiliate_url).price}\t[${p.price_band}] ${p.brand} — ${p.name}`));
}
console.log("\nsample link:", products[0].affiliate_url);
