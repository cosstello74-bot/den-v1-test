import data from "../data/logic.json";

export type Input = {
  purpose: "gaming" | "work" | "creative" | "general";
  budget: "low" | "mid" | "high";
};

export function getRecommendation(input: Input) {
  const rule = data.rules.find(
    (r) => r.if.purpose === input.purpose && r.if.budget === input.budget
  );

  const products = rule
    ? rule.recommendations.map((id) => data.products.find((p) => p.id === id))
    : data.products.slice(0, 3);

  return products
    .filter(Boolean)
    .map((p, index) => ({
      rank: index + 1,
      ...p,
      affiliate_url: p!.affiliate_url,
    }));
}
