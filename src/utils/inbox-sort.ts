import type { ConversationAiInsight } from "@/src/types";

export type InboxSortOrder = "newest" | "oldest" | "aiPriority";

/** Minutes from midnight parsed from demo receivedAt strings (e.g. "Today, 09:42"). */
export function parseReceivedAtMinutes(receivedAt: string): number {
  const match = receivedAt.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function sortByReceivedAt<T extends { receivedAt: string }>(items: T[], order: InboxSortOrder): T[] {
  if (order === "aiPriority") return [...items];
  return [...items].sort((a, b) => {
    const delta = parseReceivedAtMinutes(a.receivedAt) - parseReceivedAtMinutes(b.receivedAt);
    return order === "newest" ? -delta : delta;
  });
}

export function sortByInboxPriority<T extends { id: string; receivedAt: string }>(
  items: T[],
  insights: Record<string, ConversationAiInsight>,
): T[] {
  const priorityWeight = { hot: 3, warm: 2, cold: 1 };
  return [...items].sort((a, b) => {
    const aInsight = insights[a.id];
    const bInsight = insights[b.id];
    const scoreDelta = (bInsight?.score ?? 0) - (aInsight?.score ?? 0);
    if (scoreDelta !== 0) return scoreDelta;

    const priorityDelta = (priorityWeight[bInsight?.priority ?? "cold"] ?? 0) - (priorityWeight[aInsight?.priority ?? "cold"] ?? 0);
    if (priorityDelta !== 0) return priorityDelta;

    return parseReceivedAtMinutes(b.receivedAt) - parseReceivedAtMinutes(a.receivedAt);
  });
}
