import { demoMessages, demoProperties, getLocalizedMessage, getLocalizedProperty } from "@/src/data/demo-data";
import type { Briefing, Locale } from "@/src/types";
import { formatMissingField } from "./labels";

type IdLookup = {
  messages: Map<string, string>;
  properties: Map<string, string>;
};

function buildIdLookup(locale: Locale): IdLookup {
  const messages = new Map<string, string>();
  const properties = new Map<string, string>();

  for (const message of demoMessages) {
    messages.set(message.id, getLocalizedMessage(message, locale).leadName);
  }
  for (const property of demoProperties) {
    properties.set(property.id, getLocalizedProperty(property, locale).title);
  }

  return { messages, properties };
}

const INTERNAL_FIELD_CODES = new Set([
  "parking_info",
  "epc_rating",
  "council_tax_band",
  "viewing_request",
  "availability_question",
  "parking_question",
  "valuation_request",
  "rental_search",
  "budget_period_clarification",
  "general_enquiry",
]);

const TOOL_NAME_PATTERN =
  /\b(get_message|get_lead_profile|search_properties|check_listing_completeness|check_stale_availability|get_activity_log|create_crm_note_draft|create_follow_up_draft|get_active_leads|check_all_listing_completeness|check_stale_availability_batch|generate_daily_priorities)\b/gi;

export function sanitizeUserFacingText(text: string, locale: Locale, lookup = buildIdLookup(locale)): string {
  let result = text.trim();
  if (!result) return result;

  for (const [id, label] of lookup.messages) {
    result = result.replaceAll(new RegExp(`\\s*\\(${id}\\)`, "gi"), "");
    result = result.replaceAll(new RegExp(`\\b${id}\\b`, "gi"), label);
  }

  for (const [id, label] of lookup.properties) {
    result = result.replaceAll(new RegExp(`\\s*\\(${id}\\)`, "gi"), "");
    result = result.replaceAll(new RegExp(`\\b${id}\\b`, "gi"), label);
  }

  result = result.replace(TOOL_NAME_PATTERN, "").replace(/\b\d+\s+tools?\b/gi, "");

  result = result.replace(/\b([a-z]+(?:_[a-z]+)+)\b/g, (match) => {
    if (!INTERNAL_FIELD_CODES.has(match)) return match;
    return formatMissingField(match, locale);
  });

  result = result
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/:\s*:/g, ":")
    .trim();

  return result;
}

export function sanitizeUserFacingList(items: string[], locale: Locale): string[] {
  const lookup = buildIdLookup(locale);
  return items.map((item) => sanitizeUserFacingText(item, locale, lookup)).filter(Boolean);
}

export function sanitizeBriefingForDisplay(briefing: Briefing, locale: Locale): Briefing {
  return {
    ...briefing,
    title: sanitizeUserFacingText(briefing.title, locale),
    summary: sanitizeUserFacingText(briefing.summary, locale),
    priorities: sanitizeUserFacingList(briefing.priorities, locale),
    risks: sanitizeUserFacingList(briefing.risks, locale),
    recommendedActions: sanitizeUserFacingList(briefing.recommendedActions, locale),
    operatingInsights: briefing.operatingInsights
      ? sanitizeUserFacingList(briefing.operatingInsights, locale)
      : undefined,
    unresolvedItems: briefing.unresolvedItems
      ? sanitizeUserFacingList(briefing.unresolvedItems, locale)
      : undefined,
  };
}
