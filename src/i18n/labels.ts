import type { ActionCard, Briefing, Locale, MessageStatus, Property, PropertyAvailability } from "@/src/types";

const labels = {
  en: {
    intent: {
      viewing_request: "Viewing request",
      availability_question: "Availability question",
      parking_question: "Parking question",
      valuation_request: "Valuation request",
      rental_search: "Rental search",
      budget_period_clarification: "Budget needs clarification",
      general_enquiry: "General enquiry",
    },
    customerType: {
      buyer: "Buyer",
      tenant: "Tenant",
      seller: "Seller",
      landlord: "Landlord",
      unknown: "Unknown customer type",
    },
    temperature: { cold: "Cold", warm: "Warm", hot: "Hot" },
    status: { new: "New", reviewing: "Reviewing", actioned: "Actioned" },
    availability: {
      available: "Available",
      under_offer: "Under offer",
      let_agreed: "Let agreed",
      sold: "Sold",
    },
    channel: {
      "Website Form": "Website Form",
      Rightmove: "Rightmove",
      Zoopla: "Zoopla",
      Email: "Email",
    },
    fields: {
      parking_info: "Parking details",
      epc_rating: "EPC rating",
      council_tax_band: "Council tax band",
      tenure: "Tenure",
    },
    risk: {
      parking_info_missing: "Parking details need confirmation",
      availability_may_be_stale: "Availability may be out of date",
      property_under_offer: "The matched property is under offer",
      pcm_pw_ambiguity: "Budget period is unclear",
      low_match_confidence: "Property match needs human confirmation",
    },
    generatedAction: {
      viewing_scheduling: "Check viewing availability and propose suitable appointment times.",
      parking_verification: "Confirm parking details before replying to the customer.",
      listing_update: "Update the listing after the missing information is verified.",
      crm_note: "Save the relevant customer context in CRM.",
      follow_up: "Create a follow-up task for the agent.",
      valuation_call: "Arrange a valuation call with the customer.",
      budget_clarification: "Clarify the customer's budget before recommending properties.",
    },
    propertyType: { Flat: "Flat", Studio: "Studio", House: "House" },
    source: { gemini: "AI assisted", fallback: "Guided demo" },
  },
  tr: {
    intent: {
      viewing_request: "Evi görme talebi",
      availability_question: "Müsaitlik sorusu",
      parking_question: "Otopark sorusu",
      valuation_request: "Değerleme talebi",
      rental_search: "Kiralık arayışı",
      budget_period_clarification: "Bütçe netleştirilmeli",
      general_enquiry: "Genel talep",
    },
    customerType: {
      buyer: "Alıcı",
      tenant: "Kiracı adayı",
      seller: "Satıcı",
      landlord: "Ev sahibi",
      unknown: "Müşteri tipi belirsiz",
    },
    temperature: { cold: "Düşük öncelik", warm: "Orta öncelik", hot: "Yüksek öncelik" },
    status: { new: "Yeni", reviewing: "İnceleniyor", actioned: "Aksiyon alındı" },
    availability: {
      available: "Müsait",
      under_offer: "Teklif sürecinde",
      let_agreed: "Kiralamada anlaşma sağlandı",
      sold: "Satıldı",
    },
    channel: {
      "Website Form": "Web Formu",
      Rightmove: "Rightmove",
      Zoopla: "Zoopla",
      Email: "E-posta",
    },
    fields: {
      parking_info: "Otopark bilgisi",
      epc_rating: "EPC derecesi",
      council_tax_band: "Belediye vergi bandı",
      tenure: "Mülkiyet türü",
    },
    risk: {
      parking_info_missing: "Otopark bilgisi doğrulanmalı",
      availability_may_be_stale: "Müsaitlik bilgisi güncel olmayabilir",
      property_under_offer: "Eşleşen ilan teklif sürecinde",
      pcm_pw_ambiguity: "Bütçe dönemi belirsiz",
      low_match_confidence: "İlan eşleşmesi insan onayı gerektiriyor",
    },
    generatedAction: {
      viewing_scheduling: "Evi görme randevusu için uygun saatleri kontrol et ve öner.",
      parking_verification: "Müşteriye dönmeden önce otopark bilgisini doğrula.",
      listing_update: "Eksik bilgi doğrulandıktan sonra ilanı güncelle.",
      crm_note: "Müşteriyle ilgili önemli bağlamı müşteri kaydına ekle.",
      follow_up: "Danışman için takip görevi oluştur.",
      valuation_call: "Müşteriyle değerleme görüşmesi planla.",
      budget_clarification: "İlan önermeden önce müşterinin bütçesini netleştir.",
    },
    propertyType: { Flat: "Daire", Studio: "Stüdyo", House: "Ev" },
    source: { gemini: "Yapay zeka destekli", fallback: "DEMO modu" },
  },
} as const;

export function formatIntent(code: string, locale: Locale) {
  return labels[locale].intent[code as keyof typeof labels.en.intent] ?? code.replaceAll("_", " ");
}

export function formatMissingField(code: string, locale: Locale) {
  return labels[locale].fields[code as keyof typeof labels.en.fields] ?? code.replaceAll("_", " ");
}

export function formatRiskFlag(code: string, fallbackLabel: string, locale: Locale) {
  return labels[locale].risk[code as keyof typeof labels.en.risk] ?? fallbackLabel;
}

export function formatCustomerType(type: ActionCard["customerType"], locale: Locale) {
  return labels[locale].customerType[type];
}

export function formatTemperature(temperature: ActionCard["leadTemperature"], locale: Locale) {
  return labels[locale].temperature[temperature];
}

export function formatStatus(status: MessageStatus, locale: Locale) {
  return labels[locale].status[status];
}

export function formatAvailability(availability: PropertyAvailability, locale: Locale) {
  return labels[locale].availability[availability];
}

export function formatChannel(channel: string, locale: Locale) {
  return labels[locale].channel[channel as keyof typeof labels.en.channel] ?? channel;
}

export function formatPropertyType(type: Property["type"], locale: Locale) {
  return labels[locale].propertyType[type];
}

export function formatSource(source: Briefing["source"], locale: Locale) {
  return labels[locale].source[source];
}

export function formatGeneratedActionText(value: string, locale: Locale) {
  const trimmed = value.trim();
  const mapped = labels[locale].generatedAction[trimmed as keyof typeof labels.en.generatedAction];
  if (mapped) return mapped;

  const looksLikeCode = /^[a-z]+(_[a-z]+)+$/.test(trimmed);
  if (!looksLikeCode) return value;

  if (locale === "tr") {
    return "Danışman için ilgili aksiyonu oluştur.";
  }

  return trimmed
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
