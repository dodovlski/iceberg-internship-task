import type { ActivityEvent, ActionCard, ConversationContextSource, Locale } from "@/src/types";
import { generateAgenticActionCard } from "./agent-runner";

export async function generateActionCard(
  messageId: string,
  locale: Locale = "en",
  activityLog: ActivityEvent[] = [],
  supplementalContext: ConversationContextSource[] = [],
): Promise<ActionCard> {
  return generateAgenticActionCard(messageId, locale, activityLog, supplementalContext);
}
