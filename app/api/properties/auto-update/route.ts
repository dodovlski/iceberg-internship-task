import { NextResponse } from "next/server";
import { generateListingUpdateDraft } from "@/src/ai/listing-updater";
import { normaliseLocale } from "@/src/i18n/get-dictionary";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      propertyId?: string;
      inputText?: string;
      locale?: string;
    };

    if (!body.propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }
    if (!body.inputText?.trim()) {
      return NextResponse.json({ error: "inputText is required" }, { status: 400 });
    }

    const draft = await generateListingUpdateDraft(body.propertyId, body.inputText, normaliseLocale(body.locale ?? "en"));
    return NextResponse.json(draft);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
