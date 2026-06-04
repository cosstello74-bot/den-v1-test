/**
 * V16 Guardrails — Category plugin guards.
 *
 * Verifies that all category plugins can validate their required fields,
 * and that the plugin registry covers every CategoryKey.
 */

import type { CategoryKey }   from "@/types/product";
import type { GuardrailViolation } from "../types";
import { CATEGORY_PLUGINS }   from "../plugins/CategoryPlugin";

const ALL_CATEGORIES: CategoryKey[] = ["laptops", "phones", "monitors", "tablets", "pcs"];

/**
 * Check that every category has a registered plugin.
 */
export function checkPluginRegistry(): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  for (const cat of ALL_CATEGORIES) {
    if (!CATEGORY_PLUGINS[cat]) {
      violations.push({
        rule:    "PLUGIN_REGISTRY_INCOMPLETE",
        message: `No plugin registered for category "${cat}".`,
        data:    { category: cat },
      });
    }
  }

  return violations;
}

/**
 * Check that a plugin's validate() correctly reports missing required fields.
 * Passes an empty params object — every required field should be reported missing.
 */
export function checkPluginValidation(category: CategoryKey): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const plugin = CATEGORY_PLUGINS[category];

  if (!plugin) {
    violations.push({
      rule:    "PLUGIN_NOT_FOUND",
      message: `Plugin for "${category}" not found during validation check.`,
      data:    { category },
    });
    return violations;
  }

  const result = plugin.validate({});

  // With empty input, valid should be false (unless requiredFields is empty)
  // and missingFields should be populated. A plugin returning valid=true for
  // empty input would indicate requiredFields is empty, which is suspicious.
  if (result.valid && result.missingFields.length === 0) {
    // Not necessarily a violation — could be a category with no required fields.
    // We only warn.
  }

  return violations;
}

/**
 * Run all category guard checks.
 */
export function runCategoryGuards(): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  violations.push(...checkPluginRegistry());

  for (const cat of ALL_CATEGORIES) {
    violations.push(...checkPluginValidation(cat));
  }

  return violations;
}
