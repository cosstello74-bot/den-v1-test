// One-off generator for data/categories/home.json
// Builds Awin deep links to real Boxed2me product pages.
// awinmid=0 is a SENTINEL — the Track 3 safety net treats it as non-live
// ("Price link coming soon") until the real Boxed2me merchant ID is filled in.
import { writeFileSync } from "node:fs";

const AWINAFFID = "2926103";          // publisher ID (same across all Awin programs)
const AWINMID   = "75674";            // Boxed2me advertiser ID (Awin)

const link = (dest) =>
  `https://www.awin1.com/cread.php?awinmid=${AWINMID}&awinaffid=${AWINAFFID}&ued=${encodeURIComponent(dest)}`;

// [id, name, sub-type, price_band, brand, destination, gaming, battery, productivity, portability, value]
// score remap for home goods:
//   gaming=Power/Capacity  battery=Energy efficiency  productivity=Performance
//   portability=Compact/Easy  value=Value for money
const rows = [
  ["h1","Nedis HEPA Air Purifier (45m²)","climate","mid","Nedis","https://boxed2me.co.uk/product/nedis-air-purifier-hepa-with-4-speeds-air-quality-sensor-and-filter-change-reminder-removes-up-t-42092",78,82,88,70,84],
  ["h2","Prem-I-Air 20L Compressor Dehumidifier","climate","mid","Prem-I-Air","https://boxed2me.co.uk/product/premiair-prem-i-air-20l-eh1934-r290-20l-compressor-dehumidifier-48666",90,72,90,45,80],
  ["h3","Nedis SmartLife Wi-Fi Dehumidifier 20L","climate","mid","Nedis","https://boxed2me.co.uk/product/nedis-smartlife-dehumidifier-wi-fi-20l-per-day-dehumidification-continuous-ventilation-195-m3h-45429",84,85,86,60,78],
  ["h4","Nedis 3kW Industrial Ceramic Fan Heater","climate","budget","Nedis","https://boxed2me.co.uk/product/nedis-3kw-portable-industrial-electric-ceramic-fan-heater-with-carry-handle-thermostat-and-3-settin-41726",95,55,85,58,82],
  ["h5","Prem-I-Air Compact Peltier Dehumidifier","climate","budget","Prem-I-Air","https://boxed2me.co.uk/products/prem-i-air-compact-peltier-dehumidifier-500ml-day-2l-tank-auto-shut-off-warm-air-wall-mount-or-freestanding-low-power-42w-quiet-brushless-fan-small-rooms",55,88,70,92,86],
  ["h6","Nedis 9-in-1 Air Fryer Oven 12L","kitchen","mid","Nedis","https://boxed2me.co.uk/product/nedis-multifunctional-9-in-1-air-fryer-mini-oven-12l-with-rotisserie-9-pre-set-programmes-timer-46197",92,70,90,50,85],
  ["h7","Nedis Digital 7.6L Dual Basket Air Fryer","kitchen","mid","Nedis","https://boxed2me.co.uk/product/nedis-digital-76l-dual-basket-large-air-fryer-with-timer-6-functions-45171",88,72,92,60,88],
  ["h8","Ex-Pro 6.5L Hot Air Fryer","kitchen","budget","Ex-Pro","https://boxed2me.co.uk/product/ex-pro-65l-hot-air-fryer-for-healthy-low-fat-cooking-with-adjustable-temperature-digital-display-41856",80,75,82,68,92],
  ["h9","Nedis Cordless Stick Vacuum 130W","cleaning","mid","Nedis","https://boxed2me.co.uk/products/nedis-stick-vacuum-cleaner-130-w-25-9-vac-motorized-brush-with-integrated-lighting-10000-pa-hepa-air-filter-black-orange",72,80,84,90,85],
  ["h10","Nedis Compact Bagged Vacuum 700W","cleaning","budget","Nedis","https://boxed2me.co.uk/product/nedis-compact-bagged-vacuum-cleaner-powerful-lightweight-cylinder-cleaner-with-hepa-filter-telesco-41742",78,78,85,72,90],
  ["h11","Nedis Handheld Vacuum & Air Blower 90W","cleaning","budget","Nedis","https://boxed2me.co.uk/products/nedis-handheld-vacuum-cleaner-air-blower-90-w-rechargeable-dry-li-ion-black",55,82,72,96,88],
  ["h12","Nedis Bathroom Wall Fan Heater 2000W","climate","budget","Nedis","https://boxed2me.co.uk/product/nedis-bathroom-wall-mounted-downflow-fan-heater-2000w-thermostat-2-modes-ip22-remote-white-43280",82,60,84,62,86],
];

const products = rows.map(([id,name,sub,band,brand,dest,g,b,pr,po,v]) => ({
  id,
  name,
  category: sub,
  affiliate_url: link(dest),
  price_band: band,
  battery_score: b,
  portability_score: po,
  gaming_score: g,
  productivity_score: pr,
  value_score: v,
  screen_size: sub,
  brand,
}));

const out = {
  category: "home",
  scoring_profile: { battery_bonus: 0.12, productivity_bonus: 0.15, value_bonus: 0.18 },
  products,
};

writeFileSync(new URL("../data/categories/home.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log("wrote home.json with", products.length, "products (awinmid =", AWINMID + ")");
