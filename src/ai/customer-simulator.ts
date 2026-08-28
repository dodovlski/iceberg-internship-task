import { demoProperties, getLocalizedMessage, getLocalizedProfile, getMessageById, getProfileByMessageId } from "@/src/data/demo-data";
import type { ActivityEvent, ChatMessage, ConversationContextSource, CustomerProfile, Locale } from "@/src/types";
import { generateGeminiJson } from "./gemini-client";

type CustomerReplyResponse = {
  reply?: string;
  mood?: string;
  signal?: string;
};

function fallbackReply(profile: CustomerProfile, agentText: string, locale: Locale) {
  const lower = agentText.toLowerCase();
  if (locale === "tr") {
    if (lower.includes("otopark") || lower.includes("parking")) {
      return `${profile.name}: Teşekkürler. Otopark bilgisini netleştirmeniz iyi olur; tahminle ilerlemek istemiyorum. Uygun saatleri de yazarsanız hızlıca karar verebilirim.`;
    }
    if (lower.includes("randevu") || lower.includes("view") || lower.includes("gorme")) {
      return `${profile.name}: Uygun olabilir. Bana net saat ve hangi bilginin henüz doğrulanmadığını açık yazarsanız daha rahat ilerlerim.`;
    }
    if (lower.includes("fiyat") || lower.includes("teklif")) {
      return `${profile.name}: Fiyat tarafını net duymam gerekiyor. Esneklik ihtimali varsa ciddiyim, yoksa zaman kaybetmeyelim.`;
    }
    return `${profile.name}: Anladım, teşekkürler. Benim için kritik nokta şu: ${profile.mainProblem} Buna göre net sonraki adımı paylaşabilir misiniz?`;
  }

  if (lower.includes("parking")) {
    return `${profile.name}: Thanks. Please confirm the parking rather than assuming it. If you can also send the viewing options, I can decide quickly.`;
  }
  if (lower.includes("view") || lower.includes("appointment")) {
    return `${profile.name}: That could work. Please send the exact time and be clear about anything that still needs checking.`;
  }
  if (lower.includes("price") || lower.includes("offer")) {
    return `${profile.name}: I need a clear answer on the price position. If there is flexibility, I am serious; if not, I would rather know now.`;
  }
  return `${profile.name}: Thanks, understood. The key thing for me is: ${profile.mainProblem} What is the clearest next step from here?`;
}

export function buildCustomerReplyPrompt({
  profile,
  message,
  chatHistory,
  activityLog,
  supplementalContext,
  agentText,
  locale,
  isOffer = false,
}: {
  profile: CustomerProfile;
  message: ReturnType<typeof getLocalizedMessage>;
  chatHistory: ChatMessage[];
  activityLog: ActivityEvent[];
  supplementalContext: ConversationContextSource[];
  agentText: string;
  locale: Locale;
  isOffer?: boolean;
}) {
  const relatedProperty = demoProperties.find((property) => property.id === message.propertyReferenceId);
  return `
You are simulating a real customer in an EstateOS demo. Stay in character.
Write in ${locale === "tr" ? "Turkish with proper diacritics (ç, ğ, ı, ö, ş, ü, İ); never use ASCII substitutes" : "English"}.
Return only JSON:
{
  "reply": "string",
  "mood": "string",
  "signal": "string"
}

Customer profile:
${JSON.stringify(profile, null, 2)}

Original enquiry:
${JSON.stringify(message, null, 2)}

Related property data, if any:
${JSON.stringify(relatedProperty ?? null, null, 2)}

Conversation history:
${JSON.stringify(chatHistory.slice(-10), null, 2)}

Operational actions already taken:
${JSON.stringify(activityLog.slice(-12), null, 2)}

Supplemental context from other channels:
${JSON.stringify(supplementalContext.slice(-6), null, 2)}

Agent just sent:
${agentText}

Message type: ${isOffer ? (locale === "tr" ? "Fiyat / şart teklifi (kira, satış veya pazarlık)" : "Formal price or terms offer (rent, sale or negotiation)") : locale === "tr" ? "Genel danışman mesajı" : "General agent message"}

Rules:
- Reply as the customer, not as an assistant.
- Keep personality, objections and decision style consistent.
- Remember prior messages and actions.
- Use supplemental context as memory from other platforms when it affects preferences, objections or next steps.
- React to offers, follow-up creation, missing info, CRM notes or listing flags if present in the action log.
- Do not invent unavailable property facts. If the agent has not verified something, ask for confirmation.
- Keep the reply natural and short enough for a messaging panel.
`;
}

export async function generateCustomerReply({
  messageId,
  agentText,
  isOffer = false,
  locale,
  chatHistory,
  activityLog,
  supplementalContext = [],
}: {
  messageId: string;
  agentText: string;
  isOffer?: boolean;
  locale: Locale;
  chatHistory: ChatMessage[];
  activityLog: ActivityEvent[];
  supplementalContext: ConversationContextSource[];
}) {
  const message = getMessageById(messageId);
  const profile = getProfileByMessageId(messageId);
  if (!message || !profile) {
    throw new Error("Customer profile not found");
  }

  const localizedMessage = getLocalizedMessage(message, locale);
  const localizedProfile = getLocalizedProfile(profile, locale);
  const gemini = await generateGeminiJson<CustomerReplyResponse>(
    buildCustomerReplyPrompt({
      profile: localizedProfile,
      message: localizedMessage,
      chatHistory,
      activityLog,
      supplementalContext,
      agentText,
      locale,
      isOffer,
    }),
  );

  return {
    reply: gemini?.reply?.trim() || fallbackReply(localizedProfile, agentText, locale),
    mood: gemini?.mood || (localizedProfile.urgency === "high" ? "urgent" : "engaged"),
    signal: gemini?.signal || localizedProfile.preferredOutcome,
    source: gemini ? "gemini" : "fallback",
  };
}
