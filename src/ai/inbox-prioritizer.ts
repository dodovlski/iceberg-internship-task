import type { ConversationAiInsight, InboxPrioritizationItem, InboxPriority, Locale } from "@/src/types";
import { generateGeminiJson } from "./gemini-client";

const MODEL_VERSION = "inbox-priority-v1";

type InboxPriorityPayload = {
  insights?: Array<Partial<ConversationAiInsight>>;
};

function clampScore(score: number) {
  if (Number.isNaN(score)) return 50;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function priorityFromScore(score: number): InboxPriority {
  if (score >= 76) return "hot";
  if (score >= 45) return "warm";
  return "cold";
}

function labelFor(priority: InboxPriority, locale: Locale) {
  if (locale === "tr") {
    return priority === "hot" ? "Dönüşüm ihtimali yüksek" : priority === "warm" ? "İlgili ama netleşmeli" : "Düşük niyetli";
  }
  return priority === "hot" ? "High conversion intent" : priority === "warm" ? "Interested but not confirmed" : "Low intent";
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function fallbackInsight(item: InboxPrioritizationItem, locale: Locale): ConversationAiInsight {
  const newText = item.newMessages.map((message) => message.text).join(" ").toLowerCase();
  const previous = item.previousInsight;
  let score = previous?.score ?? 42;

  if (includesAny(newText, ["book", "viewing", "today", "this week", "fastest", "ready", "start", "valuation", "selling", "landlord"])) score += 28;
  if (includesAny(newText, ["price", "budget", "available", "details", "interested", "call", "appointment", "offer"])) score += 18;
  if (includesAny(newText, ["fiyat", "bütçe", "müsait", "detay", "ilgilen", "randevu", "teklif"])) score += 18;
  if (includesAny(newText, ["bugün", "hemen", "bu hafta", "başlamak", "görüşme", "değerleme", "satmak", "kiraya vermek"])) score += 28;
  if (includesAny(newText, ["already gone", "under offer", "concern", "unclear", "500"])) score -= 12;
  if (includesAny(newText, ["güven", "teklif sürecinde", "belirsiz", "kaygı"])) score -= 12;
  if (item.status === "new") score += 5;

  score = clampScore(score);
  const priority = priorityFromScore(score);
  const latestMessage = item.newMessages[item.newMessages.length - 1];
  const reason =
    locale === "tr"
      ? `${labelFor(priority, locale)}: yeni mesajlarda ${priority === "hot" ? "hızlı aksiyon veya satın alma/kiralama sinyali" : priority === "warm" ? "ilgi sinyali" : "zayıf ya da belirsiz niyet"} görünüyor.`
      : `${labelFor(priority, locale)}: new messages show ${priority === "hot" ? "clear action or conversion intent" : priority === "warm" ? "interest that needs qualification" : "weak or unclear intent"}.`;
  const summaryBase = previous?.summary ? `${previous.summary} ` : "";
  const summary =
    locale === "tr"
      ? `${summaryBase}Son güncelleme: ${latestMessage?.text.slice(0, 120) ?? item.subject}`.trim()
      : `${summaryBase}Latest update: ${latestMessage?.text.slice(0, 120) ?? item.subject}`.trim();

  return {
    conversationId: item.conversationId,
    priority,
    score,
    reason,
    summary,
    lastAnalyzedMessageId: latestMessage?.id ?? previous?.lastAnalyzedMessageId ?? item.conversationId,
    lastAnalyzedAt: new Date().toISOString(),
    modelVersion: MODEL_VERSION,
    source: "fallback",
  };
}

function buildPrompt(items: InboxPrioritizationItem[], locale: Locale) {
  return `
You are an inbox prioritisation assistant for a professional estate agency CRM.
The app sends only new conversation turns plus the previously saved AI insight.
Update the saved insight; do not assume you have the full conversation unless it is included in previousInsight.summary.
Write user-facing text in ${locale === "tr" ? "Turkish" : "English"}.

Return only JSON:
{
  "insights": [
    {
      "conversationId": "string",
      "priority": "hot|warm|cold",
      "score": 0,
      "reason": "short sales-facing explanation",
      "summary": "compact rolling conversation summary"
    }
  ]
}

Scoring:
- hot: ready to book, wants valuation, asks price/terms with timing, seller/landlord intent, urgent next step.
- warm: clear interest but timing or qualification is still missing.
- cold: weak fit, unclear budget, low intent, trust concern, spam-like or only generic browsing.
- Preserve useful previous summary, then fold in only the new messages.
- Keep reason short. Do not expose internal IDs except conversationId.

Conversations:
${JSON.stringify(items, null, 2)}
`;
}

function normaliseInsight(
  item: InboxPrioritizationItem,
  generated: Partial<ConversationAiInsight> | undefined,
  locale: Locale,
): ConversationAiInsight {
  const fallback = fallbackInsight(item, locale);
  const score = clampScore(typeof generated?.score === "number" ? generated.score : fallback.score);
  const priority = ["hot", "warm", "cold"].includes(generated?.priority ?? "")
    ? (generated?.priority as InboxPriority)
    : priorityFromScore(score);

  return {
    ...fallback,
    priority,
    score,
    reason: generated?.reason?.trim() || fallback.reason,
    summary: generated?.summary?.trim() || fallback.summary,
    source: generated ? "gemini" : "fallback",
  };
}

export async function prioritizeInbox(items: InboxPrioritizationItem[], locale: Locale = "en") {
  const validItems = items.filter((item) => item.newMessages.length > 0);
  if (!validItems.length) return [];

  const generated = await generateGeminiJson<InboxPriorityPayload>(buildPrompt(validItems, locale));
  const byConversation = new Map((generated?.insights ?? []).map((insight) => [insight.conversationId, insight]));

  return validItems.map((item) => normaliseInsight(item, byConversation.get(item.conversationId), locale));
}
