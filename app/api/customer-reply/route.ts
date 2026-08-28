import { NextResponse } from "next/server";
import { generateCustomerReply } from "@/src/ai/customer-simulator";
import { normaliseLocale } from "@/src/i18n/get-dictionary";
import type { ActivityEvent, ChatMessage, ConversationContextSource } from "@/src/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messageId?: string;
      agentText?: string;
      isOffer?: boolean;
      locale?: string;
      chatHistory?: ChatMessage[];
      activityLog?: ActivityEvent[];
      supplementalContext?: ConversationContextSource[];
    };

    if (!body.messageId || !body.agentText) {
      return NextResponse.json({ error: "messageId and agentText are required" }, { status: 400 });
    }

    const reply = await generateCustomerReply({
      messageId: body.messageId,
      agentText: body.agentText,
      isOffer: body.isOffer === true,
      locale: normaliseLocale(body.locale ?? "en"),
      chatHistory: Array.isArray(body.chatHistory) ? body.chatHistory : [],
      activityLog: Array.isArray(body.activityLog) ? body.activityLog : [],
      supplementalContext: Array.isArray(body.supplementalContext) ? body.supplementalContext : [],
    });

    return NextResponse.json(reply);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
