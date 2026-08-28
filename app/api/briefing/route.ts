import { NextResponse } from "next/server";
import { generateBriefing } from "@/src/ai/daily-briefing";
import { normaliseLocale } from "@/src/i18n/get-dictionary";
import type { ActivityEvent, BriefingType } from "@/src/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { type?: BriefingType; activityLog?: ActivityEvent[] };
    if (body.type !== "morning" && body.type !== "eod") {
      return NextResponse.json({ error: "type must be morning or eod" }, { status: 400 });
    }

    const briefing = await generateBriefing(
      body.type,
      normaliseLocale((body as { locale?: string }).locale ?? "en"),
      Array.isArray(body.activityLog) ? body.activityLog : [],
    );
    return NextResponse.json(briefing);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
