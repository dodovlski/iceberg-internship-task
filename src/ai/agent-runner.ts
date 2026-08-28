import type {
  ActionCard,
  ActionStep,
  ActivityEvent,
  AgentPlan,
  Briefing,
  ConfidenceBreakdown,
  ConversationContextSource,
  Locale,
  SafetyCheck,
} from "@/src/types";
import { buildMaterialInfoCheck, buildWhyFlagged, detectOpportunityInsights, findAlternativeMatches, generateFallbackActionCard, generateFallbackBriefing, inferConfidenceLevel } from "./fallbacks";
import { generateGeminiJson } from "./gemini-client";
import { buildAgenticActionCardPrompt, buildAgenticBriefingPrompt } from "./prompts";
import { normaliseConfidence } from "./schemas";
import { runActionTools, runBriefingTools } from "./agent-tools";
import { buildActionCardPromptContext, buildBriefingPromptContext } from "./public-context";
import { demoProperties } from "@/src/data/demo-data";
import { sanitizeBriefingForDisplay } from "@/src/i18n/sanitize-display";
import { runLegalPreflight } from "./legal-guardian";

type GeminiAgentActionResponse = {
  intent?: string[];
  customerType?: ActionCard["customerType"];
  leadTemperature?: ActionCard["leadTemperature"];
  confidence?: number;
  suggestedReply?: string;
  suggestedCrmNote?: string;
  suggestedFollowUp?: string;
  suggestedListingAction?: string;
  agentPlan?: AgentPlan;
  factsUsed?: string[];
  evidence?: string[];
  unknowns?: string[];
  blockedActions?: string[];
  recommendedNextBestAction?: string;
  actionPlan?: ActionStep[];
  confidenceBreakdown?: ConfidenceBreakdown;
  whyFlagged?: string[];
  suggestedNextAction?: string;
};

type GeminiAgentBriefingResponse = Pick<Briefing, "title" | "summary" | "priorities" | "risks" | "recommendedActions" | "operatingInsights" | "unresolvedItems">;

const customerTypes: ActionCard["customerType"][] = ["buyer", "tenant", "seller", "landlord", "unknown"];
const leadTemperatures: ActionCard["leadTemperature"][] = ["cold", "warm", "hot"];

function pickCustomerType(value: unknown, fallback: ActionCard["customerType"]) {
  return customerTypes.includes(value as ActionCard["customerType"]) ? (value as ActionCard["customerType"]) : fallback;
}

function pickLeadTemperature(value: unknown, fallback: ActionCard["leadTemperature"]) {
  return leadTemperatures.includes(value as ActionCard["leadTemperature"]) ? (value as ActionCard["leadTemperature"]) : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : fallback;
}

function asActionPlan(value: unknown, fallback: ActionStep[]) {
  if (!Array.isArray(value)) return fallback;
  const parsed = value.filter((item): item is ActionStep => {
    const candidate = item as Partial<ActionStep>;
    return (
      typeof candidate.label === "string" &&
      typeof candidate.detail === "string" &&
      ["high", "medium", "low"].includes(candidate.priority ?? "") &&
      ["agent", "system"].includes(candidate.owner ?? "")
    );
  });
  return parsed.length ? parsed.slice(0, 5) : fallback;
}

function briefingText(briefing: GeminiAgentBriefingResponse | null) {
  if (!briefing) return "";
  return [
    briefing.title,
    briefing.summary,
    ...(briefing.priorities ?? []),
    ...(briefing.risks ?? []),
    ...(briefing.recommendedActions ?? []),
    ...(briefing.operatingInsights ?? []),
    ...(briefing.unresolvedItems ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function isGroundedEodBriefing(briefing: GeminiAgentBriefingResponse | null, operationalLedger: ReturnType<typeof runBriefingTools>["operationalLedger"]) {
  if (!operationalLedger.hasActivity) return true;
  const text = briefingText(briefing);
  if (!text) return false;
  const mentionsTouchedLead = operationalLedger.leadSummaries.some((lead) => text.includes(lead.leadName.toLowerCase()));
  const mentionsWorkflowSignal = ["aksiyon", "gönder", "takip", "crm", "cevap", "action", "sent", "follow-up", "reply"].some((word) => text.includes(word));
  return mentionsTouchedLead && mentionsWorkflowSignal;
}

function buildFallbackPlan(card: ActionCard, locale: Locale): AgentPlan {
  return {
    goal:
      locale === "tr"
        ? "Müşteri mesajını güvenli, doğrulanabilir bir sonraki aksiyona çevirmek."
        : "Turn the customer message into a safe, verifiable next best action.",
    requiredTools: ["get_message", "get_lead_profile", "search_properties", "check_listing_completeness", "check_stale_availability", "get_activity_log"],
    knownFacts: [
      card.matchedProperty
        ? locale === "tr"
          ? `Eşleşen ilan: ${card.matchedProperty.title}.`
          : `Matched property: ${card.matchedProperty.title}.`
        : locale === "tr"
          ? "İlan eşleşmesi net değil."
          : "Property match is not confirmed.",
      locale === "tr" ? `Müşteri önceliği: ${card.leadTemperature}.` : `Lead temperature: ${card.leadTemperature}.`,
    ],
    unknowns: card.missingFields.length ? card.missingFields : card.matchedProperty ? [] : ["property_match"],
    risks: card.riskFlags.map((flag) => flag.code),
    requiresHumanApproval: true,
  };
}

function buildFallbackActionPlan(card: ActionCard, locale: Locale): ActionStep[] {
  const steps: ActionStep[] = [];
  if (card.missingFields.length) {
    steps.push({
      label: locale === "tr" ? "Eksik ilan bilgisini doğrula" : "Verify missing listing data",
      detail: card.suggestedListingAction,
      priority: "high",
      owner: "agent",
    });
  }
  steps.push({
    label: locale === "tr" ? "Takip görevini hazırla" : "Prepare follow-up task",
    detail: card.suggestedFollowUp,
    priority: card.leadTemperature === "hot" ? "high" : "medium",
    owner: "agent",
  });
  steps.push({
    label: locale === "tr" ? "Cevabı insan onayına sun" : "Stage reply for human approval",
    detail: card.replyRiskLocked
      ? locale === "tr"
        ? "Eşleşme veya veri riski çözülmeden müşteriye kesin bilgi gönderme."
        : "Do not send firm customer-facing claims until match or data risk is resolved."
      : card.suggestedReply,
    priority: "medium",
    owner: "system",
  });
  return steps;
}

function buildConfidenceBreakdown(card: ActionCard): ConfidenceBreakdown {
  const missingPenalty = Math.min(0.5, card.missingFields.length * 0.2);
  const riskPenalty = Math.min(0.4, card.riskFlags.length * 0.1);
  return {
    propertyMatch: card.confidence,
    dataCompleteness: Number(Math.max(0.2, 0.95 - missingPenalty).toFixed(2)),
    replySafety: Number(Math.max(0.25, 0.95 - riskPenalty).toFixed(2)),
  };
}

function buildSafetyChecks(card: ActionCard, locale: Locale): SafetyCheck[] {
  return [
    {
      label: locale === "tr" ? "İlan bilgisi uydurma kontrolü" : "No invented listing facts",
      passed: !card.suggestedReply.toLowerCase().includes("parking is included"),
      detail:
        locale === "tr"
          ? "Cevap, eksik alanlarda doğrulama dili kullanmalı."
          : "Reply should use verification language for missing fields.",
    },
    {
      label: locale === "tr" ? "İnsan onayı" : "Human approval",
      passed: true,
      detail: locale === "tr" ? "Müşteriye gönderim danışman onayına bağlı." : "Customer send remains behind agent approval.",
    },
    {
      label: locale === "tr" ? "Düşük güven kilidi" : "Low confidence lock",
      passed: card.confidence >= 0.7 || card.replyRiskLocked,
      detail:
        locale === "tr"
          ? "Düşük eşleşme güveninde müşteri cevabı kilitlenmeli."
          : "Customer-facing reply must be locked when match confidence is low.",
    },
  ];
}

function mergeAgentFields(card: ActionCard, gemini: GeminiAgentActionResponse | null, locale: Locale): ActionCard {
  const fallbackPlan = buildFallbackPlan(card, locale);
  const fallbackActionPlan = buildFallbackActionPlan(card, locale);
  const confidenceBreakdown = gemini?.confidenceBreakdown ?? buildConfidenceBreakdown(card);
  const confidence = normaliseConfidence(gemini?.confidence ?? card.confidence);

  return {
    ...card,
    intent: asStringArray(gemini?.intent, card.intent),
    customerType: pickCustomerType(gemini?.customerType, card.customerType),
    leadTemperature: pickLeadTemperature(gemini?.leadTemperature, card.leadTemperature),
    confidence,
    confidenceLevel: card.confidenceLevel ?? inferConfidenceLevel(confidence, null, card.missingFields, card.riskFlags),
    suggestedReply: gemini?.suggestedReply?.trim() || card.suggestedReply,
    suggestedCrmNote: gemini?.suggestedCrmNote?.trim() || card.suggestedCrmNote,
    suggestedFollowUp: gemini?.suggestedFollowUp?.trim() || card.suggestedFollowUp,
    suggestedListingAction: gemini?.suggestedListingAction?.trim() || card.suggestedListingAction,
    agentPlan: gemini?.agentPlan ?? fallbackPlan,
    factsUsed: asStringArray(gemini?.factsUsed, fallbackPlan.knownFacts),
    evidence: asStringArray(gemini?.evidence, card.riskFlags.map((flag) => flag.label)),
    whyFlagged: asStringArray(gemini?.whyFlagged, card.whyFlagged ?? []),
    unknowns: asStringArray(gemini?.unknowns, fallbackPlan.unknowns),
    blockedActions: asStringArray(
      gemini?.blockedActions,
      card.blockedActions?.length
        ? card.blockedActions
        : card.replyRiskLocked || card.missingFields.length
        ? [
            locale === "tr"
              ? "Doğrulanmamış ilan bilgisiyle kesin müşteri cevabı gönderme."
              : "Do not send firm customer-facing claims with unverified listing data.",
          ]
          : [],
    ),
    recommendedNextBestAction:
      gemini?.recommendedNextBestAction?.trim() ||
      (card.missingFields.length ? card.suggestedListingAction : card.suggestedFollowUp),
    suggestedNextAction: gemini?.suggestedNextAction?.trim() || card.suggestedNextAction,
    actionPlan: asActionPlan(gemini?.actionPlan, fallbackActionPlan),
    confidenceBreakdown,
    safetyChecks: buildSafetyChecks(card, locale),
  };
}

export async function generateAgenticActionCard(
  messageId: string,
  locale: Locale = "en",
  activityLog: ActivityEvent[] = [],
  supplementalContext: ConversationContextSource[] = [],
): Promise<ActionCard> {
  const toolContext = runActionTools(messageId, locale, activityLog);
  if (!toolContext.message) {
    throw new Error("Message not found");
  }

  const fallback = generateFallbackActionCard(toolContext.message, demoProperties, locale);
  const enrichedFallback: ActionCard = {
    ...fallback,
    matchedProperty: toolContext.match.property
      ? {
          id: toolContext.match.property.id,
          title: toolContext.match.property.title,
          location: toolContext.match.property.location,
        }
      : fallback.matchedProperty,
    missingFields: toolContext.missingFields,
    materialInfoCheck: buildMaterialInfoCheck(toolContext.match.property, locale),
    riskFlags: toolContext.riskFlags,
    whyFlagged: buildWhyFlagged(toolContext.message, toolContext.match.property, toolContext.missingFields, toolContext.riskFlags, locale),
    confidenceLevel: inferConfidenceLevel(fallback.confidence, toolContext.match.property, toolContext.missingFields, toolContext.riskFlags),
    alternativeMatches: findAlternativeMatches(toolContext.match.property, demoProperties, locale),
    opportunityInsights: detectOpportunityInsights(toolContext.message, locale),
    suggestedCrmNote: fallback.suggestedCrmNote || toolContext.crmNote,
    suggestedFollowUp: fallback.suggestedFollowUp || toolContext.followUp,
    toolCalls: toolContext.calls,
  };
  const legalGuardDecision = toolContext.match.property
    ? runLegalPreflight("send_customer_reply", toolContext.match.property, locale)
    : undefined;

  if (legalGuardDecision) {
    enrichedFallback.legalGuardDecision = legalGuardDecision;
    enrichedFallback.complianceSummary = legalGuardDecision.summary;
    enrichedFallback.blockedActions = [
      ...(enrichedFallback.blockedActions ?? []),
      ...(legalGuardDecision.status === "FAIL"
        ? [
            locale === "tr"
              ? "Compliance Guardian: eksik veya eski material information tamamlanmadan müşteri cevabı gönderme."
              : "Compliance Guardian: do not send the customer reply until missing or stale material information is resolved.",
          ]
        : []),
    ];
  }

  if (supplementalContext.length) {
    enrichedFallback.suggestedCrmNote = `${enrichedFallback.suggestedCrmNote} ${
      locale === "tr" ? "Ek sohbet notu incelenmeli." : "Supplemental conversation note should be reviewed."
    }`;
  }

  const gemini = await generateGeminiJson<GeminiAgentActionResponse>(
    buildAgenticActionCardPrompt(
      buildActionCardPromptContext({
        message: toolContext.message,
        leadProfile: toolContext.profile,
        candidateProperties: toolContext.candidates,
        matchedProperty: toolContext.match,
        missingFields: toolContext.missingFields,
        riskFlags: toolContext.riskFlags,
        activityLog: toolContext.activityLog,
        supplementalContext,
        draftCrmNote: toolContext.crmNote,
        draftFollowUp: toolContext.followUp,
        locale,
      }),
      locale,
    ),
  );

  const merged = mergeAgentFields(enrichedFallback, gemini, locale);

  return {
    ...merged,
    source: gemini ? "gemini" : "fallback",
    toolCalls: toolContext.calls,
  };
}

export async function generateAgenticBriefing(type: "morning" | "eod", locale: Locale = "en", activityLog: ActivityEvent[] = []): Promise<Briefing> {
  const toolContext = runBriefingTools(type, locale, activityLog);
  const fallback = generateFallbackBriefing(type, toolContext.activeMessages, demoProperties, locale, activityLog);
  const context = buildBriefingPromptContext({
    type,
    activeMessages: toolContext.activeMessages,
    hotMessages: toolContext.hotMessages,
    incomplete: toolContext.incomplete,
    stale: toolContext.stale,
    activityLog: toolContext.activityLog,
    unresolvedSignals: toolContext.unresolvedActions,
    operationalLedger: toolContext.operationalLedger,
    locale,
  });
  const generatedGemini = await generateGeminiJson<GeminiAgentBriefingResponse>(buildAgenticBriefingPrompt(type, context, locale));
  const gemini = type === "eod" && !isGroundedEodBriefing(generatedGemini, toolContext.operationalLedger) ? null : generatedGemini;

  return sanitizeBriefingForDisplay(
    {
      type,
      title: gemini?.title ?? fallback.title,
      summary: gemini?.summary ?? fallback.summary,
      priorities: asStringArray(gemini?.priorities, fallback.priorities),
      risks: asStringArray(gemini?.risks, fallback.risks),
      recommendedActions: asStringArray(gemini?.recommendedActions, fallback.recommendedActions),
      operatingInsights: gemini?.operatingInsights?.length
        ? asStringArray(gemini.operatingInsights, [])
        : undefined,
      unresolvedItems: asStringArray(
        gemini?.unresolvedItems,
        toolContext.operationalLedger.unresolvedItems.length
          ? toolContext.operationalLedger.unresolvedItems
          : toolContext.unresolvedActions.map((event) => `${event.customerName ?? event.title}: ${event.detail}`).slice(0, 5),
      ),
      source: gemini ? "gemini" : "fallback",
      toolCalls: toolContext.calls,
    },
    locale,
  );
}
