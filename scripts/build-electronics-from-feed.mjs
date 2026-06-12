/**
 * Build data/categories/monitors.json and pcs.json from the Acer UK Awin feed.
 *
 * Re-run after downloading a fresh feed:
 *   1. Download the Acer Create-a-Feed CSV (gzip) to %TEMP%\acer_feed.csv.gz
 *   2. node scripts/build-electronics-from-feed.mjs
 * The feed URL contains a private API key and is NEVER stored in the repo.
 *
 * Note: single-brand (Acer) catalogue — DEN recommends the best Acer monitor /
 * desktop for the user's needs. Broaden to multi-brand as more retailers join.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const csv = gunzipSync(readFileSync(process.env.TEMP + "\\acer_feed.csv.gz")).toString("utf8");

function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else { if (c === '"') inQ = true; else if (c === ",") { row.push(field); field = ""; } else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; } else if (c === "\r") {} else field += c; }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(csv);
const h = rows[0]; const data = rows.slice(1).filter(r => r.length === h.length);
const I = (n) => h.indexOf(n);
const NAME=I("product_name"), MCAT=I("merchant_category"), PRICE=I("search_price"), LINK=I("aw_deep_link");

const clamp = (n) => Math.max(40, Math.min(99, Math.round(n)));
const cleanName = (n) => n.replace(/\s+/g, " ").replace(/,\s*$/, "").trim().slice(0, 72).replace(/[ ,]+$/, "");
const brandOf = (n) => /^Predator/i.test(n) ? "Predator" : /AOPEN/i.test(n) ? "AOPEN" : "Acer";

// ── Monitors ─────────────────────────────────────────────────────────────────
function buildMonitors() {
  const items = data.filter(r => /Monitor/i.test(r[MCAT]));
  const products = items.map((r, i) => {
    const n = r[NAME]; const price = parseFloat(r[PRICE]);
    const sizeM = n.match(/(\d{2}(?:\.\d)?)\s*"/); const size = sizeM ? parseFloat(sizeM[1]) : 27;
    const refM = n.match(/(\d{2,3})\s*Hz/i); const refresh = refM ? parseInt(refM[1]) : 75;
    const is4k = /4K|UHD|3840|2160|DUHD/i.test(n); const isWQHD = /WQHD|1440|2560/i.test(n);
    const gaming = /Nitro|Predator|KG\d|gaming|FreeSync|G-?Sync/i.test(n) || refresh >= 144;
    const screen_size = size <= 24.5 ? "24-or-less" : size < 30 ? "27inch" : "32-plus";
    const category = gaming ? "gaming" : is4k ? "creative" : "work";
    const refreshTier = refresh >= 240 ? 96 : refresh >= 180 ? 90 : refresh >= 144 ? 84 : refresh >= 100 ? 72 : 60;
    return {
      id: `mn${i + 1}`,
      name: cleanName(n),
      category,
      affiliate_url: r[LINK],
      price_band: price < 200 ? "budget" : price < 400 ? "mid" : price < 700 ? "high" : "premium",
      battery_score: clamp(refreshTier - 2),                              // refresh tier (refresh_priority boost)
      portability_score: clamp(58),
      gaming_score: clamp(refreshTier + (/1\s*ms/i.test(n) ? 3 : 0)),     // gaming capability
      productivity_score: clamp((is4k ? 94 : isWQHD ? 86 : 78) + (/IPS/i.test(n) ? 3 : 0)), // panel/resolution
      value_score: clamp(100 - price / 15),
      screen_size,
      brand: brandOf(n),
    };
  });
  return { category: "monitors", scoring_profile: { productivity_bonus: 0.15, gaming_bonus: 0.10 }, products };
}

// ── Desktop PCs (incl. all-in-ones, gaming, Chromebox) ───────────────────────
function buildPCs() {
  const items = data.filter(r => /Desktop/i.test(r[MCAT]));
  const products = items.map((r, i) => {
    const n = r[NAME]; const price = parseFloat(r[PRICE]);
    const gaming = /Nitro|Predator/i.test(n);
    const aio = /All-?in-?One|Aspire C\d|Aspire S\d/i.test(n);
    const chromebox = /Chromebox/i.test(n);
    const ultra9 = /Ultra 9|i9/i.test(n), ultra7 = /Ultra 7|i7/i.test(n);
    const category = gaming ? "gaming" : aio ? "work" : chromebox ? "general" : "general";
    const gpu = gaming ? (/Predator/i.test(n) ? 97 : 88) : chromebox ? 35 : 48;
    const cpu = ultra9 ? 96 : ultra7 ? 90 : 82;
    return {
      id: `pc${i + 1}`,
      name: cleanName(n),
      category,
      affiliate_url: r[LINK],
      price_band: price < 500 ? "budget" : price < 1000 ? "mid" : price < 1500 ? "high" : "premium",
      battery_score: clamp(gpu),                          // GPU tier (GPU-priority boost)
      portability_score: clamp(aio || chromebox ? 72 : 46),
      gaming_score: clamp(gpu),
      productivity_score: clamp(cpu),
      value_score: clamp(100 - price / 60),
      screen_size: "no-preference",
      brand: brandOf(n),
    };
  });
  return { category: "pcs", scoring_profile: { gaming_bonus: 0.15, productivity_bonus: 0.10 }, products };
}

const mon = buildMonitors();
const pcs = buildPCs();
writeFileSync(new URL("../data/categories/monitors.json", import.meta.url), JSON.stringify(mon, null, 2) + "\n");
writeFileSync(new URL("../data/categories/pcs.json", import.meta.url), JSON.stringify(pcs, null, 2) + "\n");

console.log(`monitors: ${mon.products.length}, pcs: ${pcs.products.length}`);
for (const set of [mon, pcs]) {
  console.log(`\n== ${set.category} ==`);
  set.products.forEach(p => console.log(`  [${p.category}/${p.price_band}/${p.screen_size}] G${p.gaming_score} P${p.productivity_score} B${p.battery_score} V${p.value_score}  ${p.name}`));
}
console.log("\nsample link:", mon.products[0].affiliate_url.slice(0, 80));
