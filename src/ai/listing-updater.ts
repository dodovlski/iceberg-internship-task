import { demoProperties, getLocalizedProperty } from "@/src/data/demo-data";
import type { ListingUpdateDraft, Locale, Property, PropertyAvailability } from "@/src/types";
import { generateGeminiJson } from "./gemini-client";

type AiListingPayload = {
  summary?: string;
  confidence?: number;
  extracted?: ListingUpdateDraft["extracted"];
  proposedDescription?: string;
  riskFlags?: string[];
};

const updateJsonShape = `{
  "summary": "short human readable summary",
  "confidence": 0.82,
  "extracted": {
    "price": "GBP price string when present",
    "petsAllowed": true,
    "parking": "parking text when present",
    "epc": "A-G when present",
    "councilTax": "A-H when present",
    "features": ["feature"],
    "availability": "available|under_offer|let_agreed|sold"
  },
  "proposedDescription": "new public listing description",
  "riskFlags": ["risk needing human review"]
}`;

export async function generateListingUpdateDraft(propertyId: string, inputText: string, locale: Locale): Promise<ListingUpdateDraft> {
  const property = demoProperties.find((item) => item.id === propertyId);
  if (!property) throw new Error("Property not found");

  const trimmed = inputText.trim();
  if (!trimmed) throw new Error("Update text is required");

  const aiPayload = await generateGeminiJson<AiListingPayload>(buildListingUpdatePrompt(property, trimmed, locale));
  if (aiPayload) {
    const draft = buildDraftFromPayload(property, trimmed, locale, aiPayload, "gemini");
    if (draft.changes.length || draft.proposedDescription) return draft;
  }

  return buildFallbackDraft(property, trimmed, locale);
}

function buildListingUpdatePrompt(property: Property, inputText: string, locale: Locale) {
  return `
You are a controlled listing update assistant for UK estate agents.
Write summary, riskFlags and proposedDescription in ${locale === "tr" ? "Turkish" : "English"}.
Return only JSON matching this shape:
${updateJsonShape}

Rules:
- Use the selected property as the target record.
- Extract only facts clearly stated in the input.
- If the agent changes their mind, use the last stated value.
- Never update the database directly. This is only a human-review draft.
- Add risk flags for unusually large price changes, unclear property match, conflicting wording, or missing confirmation.
- Keep descriptions compliant and avoid inventing facts.

Selected property:
${JSON.stringify(property, null, 2)}

Agent note / landlord email:
${inputText}
`;
}

function buildFallbackDraft(property: Property, inputText: string, locale: Locale): ListingUpdateDraft {
  const extracted = extractStructuredChanges(inputText, property);
  const payload: AiListingPayload = {
    summary: makeSummary(extracted, locale),
    confidence: inferDraftConfidence(extracted, property),
    extracted,
    proposedDescription: buildDescription(property, extracted, locale),
    riskFlags: buildRiskFlags(property, extracted, inputText, locale),
  };

  return buildDraftFromPayload(property, inputText, locale, payload, "fallback");
}

function buildDraftFromPayload(
  property: Property,
  inputText: string,
  locale: Locale,
  payload: AiListingPayload,
  source: ListingUpdateDraft["source"],
): ListingUpdateDraft {
  const extracted = cleanExtracted(payload.extracted ?? {});
  const changes = buildChangeList(property, extracted, locale);
  const proposedDescription = payload.proposedDescription?.trim() || buildDescription(property, extracted, locale);
  const riskFlags = Array.isArray(payload.riskFlags) ? payload.riskFlags.filter(Boolean) : [];
  const confidence = clampConfidence(payload.confidence ?? inferDraftConfidence(extracted, property));

  return {
    propertyId: property.id,
    inputText,
    summary: payload.summary?.trim() || makeSummary(extracted, locale),
    changes,
    proposedDescription,
    confidence,
    riskFlags: riskFlags.length ? riskFlags : buildRiskFlags(property, extracted, inputText, locale),
    source,
    extracted,
  };
}

function extractStructuredChanges(inputText: string, property: Property): ListingUpdateDraft["extracted"] {
  const text = inputText.toLowerCase();
  const extracted: ListingUpdateDraft["extracted"] = {};
  const price = extractLatestPrice(inputText, property.price);
  if (price) extracted.price = price;

  if (/(pet|pets|evcil)/i.test(inputText)) {
    if (/(allow|allowed|yes|izin|artık izin|evet)/i.test(inputText) && !/(not allowed|no pets|izin yok|hayır)/i.test(inputText)) {
      extracted.petsAllowed = true;
    } else if (/(not allowed|no pets|izin yok|hayır)/i.test(inputText)) {
      extracted.petsAllowed = false;
    }
  }

  const features = new Set<string>();
  if (/(new|renovated|refurbished|yenilen|yeni).{0,24}(kitchen|mutfak)|(?:kitchen|mutfak).{0,24}(new|renovated|refurbished|yenilen|yeni)/i.test(inputText)) {
    features.add("New kitchen");
  }
  if (/(integrated|built-in|ankastre)/i.test(inputText)) features.add("Integrated appliances");
  if (/(garden|bahçe)/i.test(text)) features.add("Garden");
  if (/(balcony|balkon)/i.test(text)) features.add("Balcony");
  if (/(furnished|mobilyalı|eşyalı)/i.test(text)) features.add("Furnished");
  if (/(remote work|work from home|uzaktan çalışma)/i.test(text)) features.add("Work-from-home friendly");
  if (features.size) extracted.features = Array.from(features);

  const parking = extractAfter(inputText, /(parking|otopark|driveway|araç yolu)\s*(?:is|:|-|=)?\s*/i);
  if (parking) extracted.parking = titleCase(parking);

  const epc = inputText.match(/\bepc\s*(?:is|:|-|=)?\s*([a-g])\b/i);
  if (epc) extracted.epc = epc[1].toUpperCase();

  const councilTax = inputText.match(/\b(?:council tax|belediye vergisi)\s*(?:band|:|-|=)?\s*([a-h])\b/i);
  if (councilTax) extracted.councilTax = councilTax[1].toUpperCase();

  if (/(available|müsait|uygun)/i.test(inputText)) extracted.availability = "available";
  if (/(under offer|teklif sürecinde)/i.test(inputText)) extracted.availability = "under_offer";
  if (/(let agreed|kiralandı|kiralama anlaşıldı)/i.test(inputText)) extracted.availability = "let_agreed";
  if (/(sold|satıldı)/i.test(inputText)) extracted.availability = "sold";

  return extracted;
}

function extractLatestPrice(inputText: string, currentPrice: string) {
  const matches = Array.from(inputText.matchAll(/(?:£|gbp|pound|pounds)?\s*(\d{3,6})(?:\s*(?:£|gbp|pound|pounds))?/gi));
  if (!matches.length) return undefined;
  const last = matches[matches.length - 1]?.[1];
  if (!last) return undefined;
  const amount = Number(last.replace(/,/g, ""));
  if (!Number.isFinite(amount)) return undefined;
  return formatPrice(amount, currentPrice);
}

function formatPrice(amount: number, currentPrice: string) {
  const formatted = new Intl.NumberFormat("en-GB").format(amount);
  return currentPrice.toLowerCase().includes("pcm") ? `£${formatted} pcm` : `£${formatted}`;
}

function extractAfter(inputText: string, pattern: RegExp) {
  const match = inputText.match(pattern);
  if (match?.index === undefined) return undefined;
  const after = inputText.slice(match.index + match[0].length).split(/[.,;\n]/)[0]?.trim();
  if (!after || after.length > 40) return undefined;
  return after;
}

function buildChangeList(property: Property, extracted: ListingUpdateDraft["extracted"], locale: Locale) {
  const yes = locale === "tr" ? "Evet" : "Yes";
  const no = locale === "tr" ? "Hayır" : "No";
  const missing = locale === "tr" ? "Eksik" : "Missing";
  const changes: ListingUpdateDraft["changes"] = [];

  addChange(changes, "price", locale === "tr" ? "Fiyat" : "Price", property.price, extracted.price);
  if (typeof extracted.petsAllowed === "boolean") {
    addChange(changes, "petsAllowed", locale === "tr" ? "Evcil hayvan" : "Pets allowed", property.petsAllowed ? yes : no, extracted.petsAllowed ? yes : no);
  }
  addChange(changes, "parking", locale === "tr" ? "Otopark" : "Parking", property.parking ?? missing, extracted.parking);
  addChange(changes, "epc", "EPC", property.epc ?? missing, extracted.epc);
  addChange(changes, "councilTax", locale === "tr" ? "Council tax" : "Council tax", property.councilTax ?? missing, extracted.councilTax);
  if (extracted.availability) {
    addChange(changes, "availability", locale === "tr" ? "Durum" : "Availability", property.availability, extracted.availability);
  }
  if (extracted.features?.length) {
    const oldFeatures = property.features?.length ? property.features.join(", ") : missing;
    addChange(changes, "features", locale === "tr" ? "Eklenen özellik" : "Added features", oldFeatures, extracted.features.join(", "));
  }

  return changes;
}

function addChange(
  changes: ListingUpdateDraft["changes"],
  field: string,
  label: string,
  oldValue: string,
  newValue?: string,
) {
  if (!newValue || oldValue === newValue) return;
  changes.push({
    field,
    label,
    oldValue,
    newValue,
    confidence: field === "price" ? 0.78 : 0.86,
    requiresReview: true,
  });
}

function buildDescription(property: Property, extracted: ListingUpdateDraft["extracted"], locale: Locale) {
  const localized = getLocalizedProperty(property, locale);
  const features = extracted.features ?? [];
  const price = extracted.price ?? property.price;
  const pets =
    typeof extracted.petsAllowed === "boolean"
      ? extracted.petsAllowed
        ? locale === "tr"
          ? "Evcil hayvana izin verilmesi de ilani daha esnek hale getiriyor."
          : "Pet-friendly terms add extra flexibility for suitable tenants."
        : locale === "tr"
          ? "Evcil hayvan kabul edilmemektedir."
          : "Pets are not currently accepted."
      : "";

  if (locale === "tr") {
    return [
      `${localized.location} bolgesindeki ${localized.title}, ${price} fiyatıyla one cikan guncel bir secenek olarak sunuluyor.`,
      features.length ? `Yeni one cikan detaylar: ${features.join(", ")}.` : localized.description,
      pets,
      "Randevu veya sonraki adimlar icin danisman onayi sonrasinda paylasima hazirdir.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `${localized.title} in ${localized.location} is now positioned at ${price}.`,
    features.length ? `Key updates include ${features.join(", ")}.` : localized.description,
    pets,
    "Ready for agent review before publishing to customer-facing portals.",
  ]
    .filter(Boolean)
    .join(" ");
}

function makeSummary(extracted: ListingUpdateDraft["extracted"], locale: Locale) {
  const count = Object.values(extracted).filter((value) => Array.isArray(value) ? value.length > 0 : value !== undefined).length;
  if (locale === "tr") return count ? `${count} ilan alani icin guncelleme taslagi hazirlandi.` : "Net bir ilan degisikligi bulunamadi.";
  return count ? `${count} listing update items prepared for review.` : "No clear listing changes were found.";
}

function buildRiskFlags(property: Property, extracted: ListingUpdateDraft["extracted"], inputText: string, locale: Locale) {
  const flags: string[] = [];
  if (extracted.price) {
    const oldAmount = Number(property.price.replace(/[^0-9.]/g, ""));
    const newAmount = Number(extracted.price.replace(/[^0-9.]/g, ""));
    if (oldAmount && newAmount && newAmount > oldAmount * 2) {
      flags.push(locale === "tr" ? "Fiyat artis orani cok yuksek; rakam manuel kontrol edilmeli." : "Price increase is unusually high; verify the number manually.");
    }
  }
  if (/(yok dur|actually|no wait|instead|düzelt|duzelt)/i.test(inputText)) {
    flags.push(locale === "tr" ? "Not icinde fikir degisikligi var; son karar kontrol edilmeli." : "The note contains a correction; verify the final intended value.");
  }
  if (!Object.keys(extracted).length) {
    flags.push(locale === "tr" ? "AI net bir alan yakalayamadi; danisman elle kontrol etmeli." : "No clear field was extracted; agent review is required.");
  }
  return flags;
}

function inferDraftConfidence(extracted: ListingUpdateDraft["extracted"], property: Property) {
  let confidence = 0.62;
  if (extracted.price) confidence += 0.08;
  if (typeof extracted.petsAllowed === "boolean") confidence += 0.08;
  if (extracted.features?.length) confidence += 0.08;
  if (extracted.parking || extracted.epc || extracted.councilTax || extracted.availability) confidence += 0.08;
  if (property.lastUpdatedHoursAgo > 24) confidence -= 0.04;
  return clampConfidence(confidence);
}

function cleanExtracted(extracted: ListingUpdateDraft["extracted"]) {
  const next: ListingUpdateDraft["extracted"] = {};
  if (extracted.price) next.price = extracted.price;
  if (typeof extracted.petsAllowed === "boolean") next.petsAllowed = extracted.petsAllowed;
  if (extracted.parking) next.parking = extracted.parking;
  if (extracted.epc) next.epc = extracted.epc.toUpperCase();
  if (extracted.councilTax) next.councilTax = extracted.councilTax.toUpperCase();
  if (Array.isArray(extracted.features)) next.features = extracted.features.filter(Boolean);
  if (isAvailability(extracted.availability)) next.availability = extracted.availability;
  return next;
}

function isAvailability(value: unknown): value is PropertyAvailability {
  return value === "available" || value === "under_offer" || value === "let_agreed" || value === "sold";
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0.62;
  return Math.max(0.1, Math.min(0.98, Number(value.toFixed(2))));
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
}
