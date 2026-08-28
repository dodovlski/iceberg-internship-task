import { detectMissingFields } from "./fallbacks";
import type { ActivityEvent, ConversationContextSource, CustomerMessage, Locale, Property } from "@/src/types";
import { formatMissingField } from "@/src/i18n/labels";

export function toPublicLead(message: CustomerMessage) {
  return {
    customerName: message.leadName,
    subject: message.subject,
    channel: message.channel,
    status: message.status,
    priority: message.initialTemperature,
    messagePreview: message.message.slice(0, 240),
  };
}

export function toPublicListing(property: Property, locale: Locale) {
  const missingFields = detectMissingFields(property).map((field) => formatMissingField(field, locale));
  return {
    title: property.title,
    location: property.location,
    availability: property.availability,
    epc: property.epc ?? "missing",
    councilTax: property.councilTax ?? "missing",
    parking: property.parking ?? "missing",
    serviceCharge: property.serviceCharge ?? "not provided",
    groundRent: property.groundRent ?? "not provided",
    tenure: property.tenure ?? "missing",
    missingFields,
    hoursSinceAvailabilityUpdate: property.lastUpdatedHoursAgo,
  };
}

export function toPublicActivity(event: ActivityEvent) {
  return {
    customerName: event.customerName,
    title: event.title,
    detail: event.detail,
    eventType: event.type,
    time: event.createdAt,
  };
}

export function toPublicConversationContext(source: ConversationContextSource) {
  return {
    source: source.source,
    title: source.title,
    text: source.text.slice(0, 1400),
    addedAt: source.createdAt,
  };
}

export function buildBriefingPromptContext(input: {
  type: "morning" | "eod";
  activeMessages: CustomerMessage[];
  hotMessages: CustomerMessage[];
  incomplete: Property[];
  stale: Property[];
  activityLog: ActivityEvent[];
  unresolvedSignals: ActivityEvent[];
  operationalLedger?: unknown;
  locale: Locale;
}) {
  return {
    type: input.type,
    briefingMode:
      input.type === "eod"
        ? "End-of-day recap must be based primarily on operationalActivityLedger and recentActivity."
        : "Morning briefing should prioritise current inbox and listing state.",
    activeLeads: input.activeMessages.map(toPublicLead),
    highPriorityLeads: input.hotMessages.map(toPublicLead),
    listingsNeedingReview: input.incomplete.map((property) => toPublicListing(property, input.locale)),
    staleListings: input.stale.map((property) => toPublicListing(property, input.locale)),
    recentActivity: input.activityLog.slice(0, 12).map(toPublicActivity),
    unresolvedSignals: input.unresolvedSignals.slice(0, 8).map(toPublicActivity),
    operationalActivityLedger: input.operationalLedger,
  };
}

export function buildActionCardPromptContext(input: {
  message: CustomerMessage;
  leadProfile: unknown;
  candidateProperties: Array<{ property: Property; score: number }>;
  matchedProperty: { property: Property | null; confidence: number };
  missingFields: string[];
  riskFlags: Array<{ label: string; severity: string }>;
  activityLog: ActivityEvent[];
  supplementalContext: ConversationContextSource[];
  draftCrmNote: string;
  draftFollowUp: string;
  locale: Locale;
}) {
  return {
    customerMessage: {
      customerName: input.message.leadName,
      subject: input.message.subject,
      channel: input.message.channel,
      body: input.message.message,
    },
    leadProfile: input.leadProfile,
    candidateListings: input.candidateProperties.map((candidate) => ({
      title: candidate.property.title,
      location: candidate.property.location,
      matchScore: candidate.score,
    })),
    matchedListing: input.matchedProperty.property
      ? {
          title: input.matchedProperty.property.title,
          location: input.matchedProperty.property.location,
          confidence: input.matchedProperty.confidence,
          availability: input.matchedProperty.property.availability,
          epc: input.matchedProperty.property.epc ?? "missing",
          councilTax: input.matchedProperty.property.councilTax ?? "missing",
          parking: input.matchedProperty.property.parking ?? "missing",
          serviceCharge: input.matchedProperty.property.serviceCharge ?? "not provided",
          groundRent: input.matchedProperty.property.groundRent ?? "not provided",
          tenure: input.matchedProperty.property.tenure ?? "missing",
          hoursSinceAvailabilityUpdate: input.matchedProperty.property.lastUpdatedHoursAgo,
        }
      : null,
    missingFields: input.missingFields.map((field) => formatMissingField(field, input.locale)),
    riskFlags: input.riskFlags.map((flag) => ({ label: flag.label, severity: flag.severity })),
    recentActivity: input.activityLog.slice(0, 8).map(toPublicActivity),
    supplementalConversationContext: input.supplementalContext.slice(0, 6).map(toPublicConversationContext),
    draftCrmNote: input.draftCrmNote,
    draftFollowUp: input.draftFollowUp,
  };
}
