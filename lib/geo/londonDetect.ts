/**
 * London geo-detection utility.
 *
 * Uses Vercel's x-vercel-ip-latitude / x-vercel-ip-longitude headers
 * (injected at edge, no extra cost) to check whether a visitor is within
 * 35km of central London — covering all 32 Greater London boroughs.
 *
 * Falls back to x-vercel-ip-city string match when coordinates are absent.
 */

const LONDON_LAT  = 51.5074;
const LONDON_LON  = -0.1278;
const RADIUS_KM   = 35; // outermost borough (Havering) is ~28 km from Charing Cross

export function isLondonVisitor(
  latStr:  string | null,
  lonStr:  string | null,
  cityStr: string | null = null,
): boolean {
  const lat = parseFloat(latStr ?? "");
  const lon = parseFloat(lonStr ?? "");

  if (!isNaN(lat) && !isNaN(lon)) {
    const R    = 6371;
    const dLat = (lat - LONDON_LAT) * (Math.PI / 180);
    const dLon = (lon - LONDON_LON) * (Math.PI / 180);
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(LONDON_LAT * (Math.PI / 180)) *
      Math.cos(lat        * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= RADIUS_KM;
  }

  // Fallback: city header when coordinates are unavailable
  if (cityStr) return cityStr.toLowerCase().includes("london");

  return false;
}
