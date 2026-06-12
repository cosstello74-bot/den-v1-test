// One-off generator for data/categories/home.json
// Builds Awin deep links to real Boxed2me product pages.
// awinmid=0 is a SENTINEL — the Track 3 safety net treats it as non-live
// ("Price link coming soon") until the real Boxed2me merchant ID is filled in.
import { writeFileSync } from "node:fs";

const AWINAFFID = "2926103";          // publisher ID (same across all Awin programs)
const AWINMID   = "75674";            // Boxed2me advertiser ID (Awin)

const link = (dest) =>
  `https://www.awin1.com/cread.php?awinmid=${AWINMID}&awinaffid=${AWINAFFID}&ued=${encodeURIComponent(dest)}`;

// Destinations are STABLE Boxed2me category pages, not individual SKUs.
// Boxed2me is a clearance retailer with rotating stock, so specific product
// URLs 404 (and an Awin deep link to a 404 silently bounces to the homepage).
// Category pages return HTTP 200 and never go out of stock, so the deep link
// lands users on the right product type to buy. Verified 200 on 2026-06-12.
const CAT = {
  purifier:    "https://boxed2me.co.uk/home-living/climate/air-purifier",
  dehumidifier:"https://boxed2me.co.uk/home-living/climate/humidifiers",
  heater:      "https://boxed2me.co.uk/home-living/climate/heaters",
  airfryer:    "https://boxed2me.co.uk/home-living/kitchen-cooking/air-fryers-accessories",
  vacuum:      "https://boxed2me.co.uk/home-living/cleaning/vacuums",
};

// [id, name, sub-type, price_band, brand, destination, gaming, battery, productivity, portability, value]
// score remap for home goods:
//   gaming=Power/Capacity  battery=Energy efficiency  productivity=Performance
//   portability=Compact/Easy  value=Value for money
const rows = [
  ["h1","Nedis HEPA Air Purifier (45m²)","climate","mid","Nedis",CAT.purifier,78,82,88,70,84],
  ["h2","Prem-I-Air 20L Compressor Dehumidifier","climate","mid","Prem-I-Air",CAT.dehumidifier,90,72,90,45,80],
  ["h3","Nedis SmartLife Wi-Fi Dehumidifier 20L","climate","mid","Nedis",CAT.dehumidifier,84,85,86,60,78],
  ["h4","Nedis 3kW Industrial Ceramic Fan Heater","climate","budget","Nedis",CAT.heater,95,55,85,58,82],
  ["h5","Prem-I-Air Compact Peltier Dehumidifier","climate","budget","Prem-I-Air",CAT.dehumidifier,55,88,70,92,86],
  ["h6","Nedis 9-in-1 Air Fryer Oven 12L","kitchen","mid","Nedis",CAT.airfryer,92,70,90,50,85],
  ["h7","Nedis Digital 7.6L Dual Basket Air Fryer","kitchen","mid","Nedis",CAT.airfryer,88,72,92,60,88],
  ["h8","Ex-Pro 6.5L Hot Air Fryer","kitchen","budget","Ex-Pro",CAT.airfryer,80,75,82,68,92],
  ["h9","Nedis Cordless Stick Vacuum 130W","cleaning","mid","Nedis",CAT.vacuum,72,80,84,90,85],
  ["h10","Nedis Compact Bagged Vacuum 700W","cleaning","budget","Nedis",CAT.vacuum,78,78,85,72,90],
  ["h11","Nedis Handheld Vacuum & Air Blower 90W","cleaning","budget","Nedis",CAT.vacuum,55,82,72,96,88],
  ["h12","Nedis Bathroom Wall Fan Heater 2000W","climate","budget","Nedis",CAT.heater,82,60,84,62,86],
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
