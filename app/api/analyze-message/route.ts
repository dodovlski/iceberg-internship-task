import { NextResponse } from "next/server";
import { generateActionCard } from "@/src/ai/estate-agent";
import { normaliseLocale } from "@/src/i18n/get-dictionary";
import type { ActivityEvent, ConversationContextSource } from "@/src/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messageId?: string;
      activityLog?: ActivityEvent[];
      supplementalContext?: ConversationContextSource[];
    };
    if (!body.messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const actionCard = await generateActionCard(
      body.messageId,
      normaliseLocale((body as { locale?: string }).locale ?? "en"),
      Array.isArray(body.activityLog) ? body.activityLog : [],
      Array.isArray(body.supplementalContext) ? body.supplementalContext : [],
    );
    return NextResponse.json(actionCard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
