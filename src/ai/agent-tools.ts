import {
  customerProfiles,
  demoMessages,
  demoProperties,
  getLocalizedMessage,
  getLocalizedProfile,
  getLocalizedProperty,
} from "@/src/data/demo-data";
import type { ActivityEvent, AgentToolCall, CustomerMessage, Locale, Property } from "@/src/types";
import { buildRiskFlags, detectMissingFields, extractIntent, findCandidateProperties, selectBestPropertyMatch } from "./fallbacks";

type ToolResult<T> = {
  trace: AgentToolCall;
  data: T;
};

function trace(name: string, input: AgentToolCall["input"], outputSummary: string, status: AgentToolCall["status"] = "success"): AgentToolCall {
  return { name, input, outputSummary, status };
}

export function getMessageTool(messageId: string, locale: Locale): ToolResult<CustomerMessage | null> {
  const message = demoMessages.find((item) => item.id === messageId) ?? null;
  const localized = message ? getLocalizedMessage(message, locale) : null;
  return {
    data: localized,
    trace: trace(
      "get_message",
      { messageId },
      localized ? `${localized.leadName}: ${localized.subject}` : "Message was not found.",
      localized ? "success" : "blocked",
    ),
  };
}

export function getLeadProfileTool(messageId: string, locale: Locale) {
  const profile = customerProfiles.find((item) => item.messageId === messageId) ?? null;
  const localized = profile ? getLocalizedProfile(profile, locale) : null;
  return {
    data: localized,
    trace: trace(
      "get_lead_profile",
      { messageId },
      localized ? `${localized.name} / ${localized.archetype} / urgency ${localized.urgency}` : "Lead profile was not found.",
      localized ? "success" : "blocked",
    ),
  };
}

export function searchPropertiesTool(message: CustomerMessage, locale: Locale): ToolResult<Array<{ property: Property; score: number }>> {
  const candidates = findCandidateProperties(message, demoProperties).map((candidate) => ({
    ...candidate,
    property: getLocalizedProperty(candidate.property, locale),
  }));
  return {
    data: candidates,
    trace: trace(
      "search_properties",
      { messageId: message.id, query: `${message.subject} ${message.message}`.slice(0, 120) },
      candidates.length
        ? candidates.map((candidate) => `${candidate.property.title} (${Math.round(candidate.score * 100)}%)`).join(", ")
        : "No candidate property found.",
    ),
  };
}

export function checkListingCompletenessTool(property: Property | null, locale: Locale): ToolResult<string[]> {
  const missingFields = detectMissingFields(property);
  return {
    data: missingFields,
    trace: trace(
      "check_listing_completeness",
      { propertyId: property?.id ?? null },
      missingFields.length
        ? locale === "tr"
          ? `Eksik alanlar: ${missingFields.join(", ")}`
          : `Missing fields: ${missingFields.join(", ")}`
        : locale === "tr"
          ? "Temel ilan alanları dolu."
          : "Core listing fields are complete.",
    ),
  };
}

export function checkStaleAvailabilityTool(property: Property | null, locale: Locale): ToolResult<boolean> {
  const isStale = Boolean(property && property.lastUpdatedHoursAgo > 24);
  return {
    data: isStale,
    trace: trace(
      "check_stale_availability",
      { propertyId: property?.id ?? null, lastUpdatedHoursAgo: property?.lastUpdatedHoursAgo ?? null },
      property
        ? isStale
          ? locale === "tr"
            ? `Müsaitlik bilgisi ${property.lastUpdatedHoursAgo} saat önce güncellenmiş.`
            : `Availability was updated ${property.lastUpdatedHoursAgo} hours ago.`
          : locale === "tr"
            ? "Müsaitlik bilgisi 24 saat eşiğinin altında."
            : "Availability is inside the 24 hour threshold."
        : locale === "tr"
          ? "İlan eşleşmesi olmadığı için müsaitlik kontrolü yapılamadı."
          : "Availability cannot be checked without a matched property.",
      property ? "success" : "blocked",
    ),
  };
}

export function getActivityLogTool(activityLog: ActivityEvent[], messageId?: string): ToolResult<ActivityEvent[]> {
  const scoped = messageId ? activityLog.filter((event) => event.messageId === messageId) : activityLog;
  return {
    data: scoped,
    trace: trace(
      "get_activity_log",
      { messageId: messageId ?? null, eventsRead: scoped.length },
      `${scoped.length} operational event${scoped.length === 1 ? "" : "s"} read.`,
    ),
  };
}

function isBriefingNoise(event: ActivityEvent) {
  return event.type === "briefing_generated" || event.type === "message_selected";
}

function getLeadLabel(messageId: string | undefined, fallback: string | undefined, locale: Locale) {
  if (fallback) return fallback;
  if (!messageId) return locale === "tr" ? "Bilinmeyen müşteri" : "Unknown lead";
  const message = demoMessages.find((item) => item.id === messageId);
  return message ? getLocalizedMessage(message, locale).leadName : locale === "tr" ? "Bilinmeyen müşteri" : "Unknown lead";
}

export function buildOperationalActivityLedger(activityLog: ActivityEvent[], locale: Locale) {
  const meaningful = activityLog.filter((event) => !isBriefingNoise(event));
  const byLead = new Map<string, ActivityEvent[]>();

  for (const event of meaningful) {
    const key = event.messageId ?? event.customerName ?? event.id;
    byLead.set(key, [...(byLead.get(key) ?? []), event]);
  }

  const counts = {
    totalEvents: meaningful.length,
    actionCardsGenerated: meaningful.filter((event) => event.type === "action_card_generated").length,
    repliesApproved: meaningful.filter((event) => event.type === "reply_approved").length,
    repliesEdited: meaningful.filter((event) => event.type === "reply_edited").length,
    messagesSent: meaningful.filter((event) => event.type === "agent_message_sent" || event.type === "offer_sent").length,
    customerReplies: meaningful.filter((event) => event.type === "customer_reply_received").length,
    followUpsCreated: meaningful.filter((event) => event.type === "follow_up_created").length,
    listingFlagsCreated: meaningful.filter((event) => event.type === "listing_marked").length,
    crmNotesSaved: meaningful.filter((event) => event.type === "crm_note_saved").length,
  };

  const leadSummaries = Array.from(byLead.entries())
    .map(([key, events]) => {
      const sorted = [...events].reverse();
      const leadName = getLeadLabel(events[0]?.messageId, events[0]?.customerName, locale);
      const types = new Set(events.map((event) => event.type));
      const sentOutbound = types.has("agent_message_sent") || types.has("offer_sent");
      const customerReplied = types.has("customer_reply_received");
      const followUpCreated = types.has("follow_up_created");
      const listingFlagged = types.has("listing_marked");
      const crmSaved = types.has("crm_note_saved");
      const replyApprovedOrEdited = types.has("reply_approved") || types.has("reply_edited");

      const openItems: string[] = [];
      if (replyApprovedOrEdited && !sentOutbound) {
        openItems.push(locale === "tr" ? "onaylı taslak henüz gönderilmedi" : "approved draft has not been sent");
      }
      if (sentOutbound && !customerReplied) {
        openItems.push(locale === "tr" ? "müşteri cevabı bekleniyor" : "waiting for customer response");
      }
      if (listingFlagged) {
        openItems.push(locale === "tr" ? "işaretlenen ilan bilgisi doğrulanmalı" : "flagged listing information needs verification");
      }
      if (!followUpCreated && (sentOutbound || customerReplied || listingFlagged)) {
        openItems.push(locale === "tr" ? "takip görevi eksik" : "follow-up task missing");
      }
      if (!crmSaved && (sentOutbound || customerReplied || followUpCreated)) {
        openItems.push(locale === "tr" ? "CRM notu eksik" : "CRM note missing");
      }

      return {
        key,
        leadName,
        eventCount: events.length,
        completedActions: sorted.map((event) => event.title).slice(0, 6),
        latestSignal: events[0]?.detail ?? "",
        hasOutboundMessage: sentOutbound,
        hasCustomerReply: customerReplied,
        hasFollowUp: followUpCreated,
        hasListingFlag: listingFlagged,
        hasCrmNote: crmSaved,
        openItems,
      };
    })
    .sort((a, b) => b.eventCount - a.eventCount);

  const unresolvedItems = leadSummaries.flatMap((lead) => lead.openItems.map((item) => `${lead.leadName}: ${item}`)).slice(0, 8);

  return {
    hasActivity: meaningful.length > 0,
    counts,
    leadSummaries: leadSummaries.slice(0, 8),
    unresolvedItems,
    recentEvents: meaningful.slice(0, 12).map((event) => ({
      leadName: getLeadLabel(event.messageId, event.customerName, locale),
      action: event.title,
      detail: event.detail,
      type: event.type,
      time: event.createdAt,
    })),
  };
}

export function createCrmNoteDraftTool(message: CustomerMessage, property: Property | null, locale: Locale): ToolResult<string> {
  const note =
    locale === "tr"
      ? `${message.leadName}, "${message.subject}" hakkında yazdı. ${property ? `${property.title} ile eşleşti.` : "İlan eşleşmesi danışman onayı gerektiriyor."}`
      : `${message.leadName} asked about ${message.subject.toLowerCase()}. ${property ? `Matched to ${property.title}.` : "Property match needs agent confirmation."}`;
  return {
    data: note,
    trace: trace("create_crm_note_draft", { messageId: message.id, propertyId: property?.id ?? null }, note),
  };
}

export function createFollowUpDraftTool(message: CustomerMessage, property: Property | null, missingFields: string[], locale: Locale): ToolResult<string> {
  const intent = extractIntent(message);
  let followUp =
    locale === "tr"
      ? "Talebi bugün gözden geçir ve müşteriye net bir sonraki adım hazırla."
      : "Review the enquiry today and prepare a clear next step for the customer.";

  if (intent.includes("valuation_request")) {
    followUp = locale === "tr" ? "Değerleme görüşmesi planla ve satıcı zamanlamasını kayda geçir." : "Book a valuation call and capture the seller timeline.";
  } else if (missingFields.includes("parking_info")) {
    followUp = locale === "tr" ? "Otopark bilgisini doğrula ve uygun randevu saatlerini kontrol et." : "Confirm parking details and check suitable viewing slots.";
  } else if (property?.availability === "under_offer") {
    followUp = locale === "tr" ? "Teklif sürecindeki ilan için durum güncellemesi ve alternatifleri kontrol et." : "Check the under-offer status and look for available alternatives.";
  }

  return {
    data: followUp,
    trace: trace("create_follow_up_draft", { messageId: message.id, propertyId: property?.id ?? null }, followUp),
  };
}

export function runActionTools(messageId: string, locale: Locale, activityLog: ActivityEvent[] = []) {
  const calls: AgentToolCall[] = [];
  const messageResult = getMessageTool(messageId, locale);
  calls.push(messageResult.trace);
  const message = messageResult.data;

  if (!message) {
    return { calls, message: null, profile: null, candidates: [], match: { property: null, confidence: 0 }, missingFields: [], riskFlags: [], crmNote: "", followUp: "" };
  }

  const profileResult = getLeadProfileTool(messageId, locale);
  calls.push(profileResult.trace);

  const candidatesResult = searchPropertiesTool(message, locale);
  calls.push(candidatesResult.trace);

  const baseMatch = selectBestPropertyMatch(message, demoProperties);
  const localizedProperty = baseMatch.property ? getLocalizedProperty(baseMatch.property, locale) : null;

  const completenessResult = checkListingCompletenessTool(baseMatch.property, locale);
  calls.push(completenessResult.trace);

  const staleResult = checkStaleAvailabilityTool(baseMatch.property, locale);
  calls.push(staleResult.trace);

  const activityResult = getActivityLogTool(activityLog, messageId);
  calls.push(activityResult.trace);

  const riskFlags = buildRiskFlags(message, baseMatch.property, baseMatch.confidence, completenessResult.data);

  const crmNoteResult = createCrmNoteDraftTool(message, localizedProperty, locale);
  calls.push(crmNoteResult.trace);

  const followUpResult = createFollowUpDraftTool(message, baseMatch.property, completenessResult.data, locale);
  calls.push(followUpResult.trace);

  return {
    calls,
    message,
    profile: profileResult.data,
    candidates: candidatesResult.data,
    match: { property: localizedProperty, confidence: baseMatch.confidence },
    missingFields: completenessResult.data,
    staleAvailability: staleResult.data,
    activityLog: activityResult.data,
    riskFlags,
    crmNote: crmNoteResult.data,
    followUp: followUpResult.data,
  };
}

export function runBriefingTools(type: "morning" | "eod", locale: Locale, activityLog: ActivityEvent[] = []) {
  const calls: AgentToolCall[] = [];
  const activity = getActivityLogTool(activityLog);
  calls.push(activity.trace);

  const activeMessages = demoMessages.map((message) => getLocalizedMessage(message, locale));
  const hotMessages = activeMessages.filter((message) => message.initialTemperature === "hot");
  calls.push(trace("get_active_leads", { count: activeMessages.length }, `${activeMessages.length} active leads, ${hotMessages.length} high-priority leads.`));

  const incomplete = demoProperties.filter((property) => detectMissingFields(property).length > 0).map((property) => getLocalizedProperty(property, locale));
  calls.push(trace("check_all_listing_completeness", { count: demoProperties.length }, `${incomplete.length} listings need missing-field review.`));

  const stale = demoProperties.filter((property) => property.lastUpdatedHoursAgo > 24).map((property) => getLocalizedProperty(property, locale));
  calls.push(trace("check_stale_availability_batch", { thresholdHours: 24 }, `${stale.length} listings have stale availability signals.`));

  const operationalLedger = buildOperationalActivityLedger(activity.data, locale);
  calls.push(
    trace(
      "summarise_operational_activity",
      { type, eventsRead: operationalLedger.counts.totalEvents, leadsTouched: operationalLedger.leadSummaries.length },
      operationalLedger.hasActivity
        ? `${operationalLedger.counts.totalEvents} user actions across ${operationalLedger.leadSummaries.length} leads summarised.`
        : "No meaningful user actions found in the current activity log.",
    ),
  );

  const unresolvedActions = activity.data.filter((event) => ["listing_marked", "follow_up_created", "customer_reply_received", "offer_sent", "reply_approved", "reply_edited"].includes(event.type));
  calls.push(trace("generate_daily_priorities", { type, eventSignals: unresolvedActions.length }, `${unresolvedActions.length} operational signals used for prioritisation.`));

  return { calls, activeMessages, hotMessages, incomplete, stale, activityLog: activity.data, unresolvedActions, operationalLedger };
}
