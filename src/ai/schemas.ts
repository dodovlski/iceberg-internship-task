import type { ActionCard, Briefing } from "@/src/types";

export type ActionCardPayload = Omit<ActionCard, "source">;
export type BriefingPayload = Omit<Briefing, "source">;

export const actionCardJsonShape = `{
  "intent": ["viewing_request"],
  "customerType": "tenant",
  "leadTemperature": "hot",
  "confidence": 0.86,
  "confidenceLevel": "medium",
  "whyFlagged": ["Customer asked about parking", "Parking information is missing"],
  "suggestedReply": "professional reply that does not invent unknown facts",
  "suggestedCrmNote": "short CRM note",
  "suggestedFollowUp": "next task",
  "suggestedListingAction": "listing action",
  "suggestedNextAction": "human-approved next operational action"
}`;

export function normaliseConfidence(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numberValue)) return 0.62;
  return Math.max(0, Math.min(0.99, numberValue));
}
