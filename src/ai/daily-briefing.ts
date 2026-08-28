import type { ActivityEvent, Briefing, BriefingType, Locale } from "@/src/types";
import { generateAgenticBriefing } from "./agent-runner";

export async function generateBriefing(type: BriefingType, locale: Locale = "en", activityLog: ActivityEvent[] = []): Promise<Briefing> {
  return generateAgenticBriefing(type, locale, activityLog);
}
