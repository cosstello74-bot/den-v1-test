import data from "../data/logic.json";

export type Input = {
  purpose: "gaming" | "work" | "creative" | "general";
  budget: "low" | "mid" | "high";
};

export function getRecommendation(input: Input) {
  const rule = data.rules.find(
    (r) => r.if.purpose === input.purpose && r.if.budget === input.budget
  );

  const candidates = rule
    ? rule.recommendations.map((id) => data.products.find((p) => p.id === id))
    : data.products.slice(0, 3);

  return candidates
    .filter((p): p is NonNullable<typeof p> => {
      if (p === undefined) {
        console.warn("[engine] recommendation references unknown product id");
      }
      return p !== undefined;
    })
    .map((p, index) => ({
      rank: index + 1,
      ...p,
      affiliate_url: p.affiliate_url,
    }));
}
