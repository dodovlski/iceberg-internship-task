import { NextResponse } from "next/server";
import { prioritizeInbox } from "@/src/ai/inbox-prioritizer";
import { normaliseLocale } from "@/src/i18n/get-dictionary";
import type { InboxPrioritizationItem } from "@/src/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { conversations?: InboxPrioritizationItem[]; locale?: string };
    const conversations = Array.isArray(body.conversations) ? body.conversations : [];
    if (!conversations.length) {
      return NextResponse.json({ insights: [], analyzedCount: 0 });
    }

    const insights = await prioritizeInbox(conversations, normaliseLocale(body.locale ?? "en"));
    return NextResponse.json({ insights, analyzedCount: insights.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
