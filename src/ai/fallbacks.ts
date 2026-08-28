import type { ActionCard, ActivityEvent, AlternativeMatch, Briefing, CustomerMessage, Locale, MaterialInfoItem, OpportunityInsight, Property, RiskFlag } from "@/src/types";
import { getLocalizedProperty } from "@/src/data/demo-data";

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

export function extractIntent(message: CustomerMessage) {
  const text = message.message.toLowerCase();
  const intent: string[] = [];
  if (includesAny(text, ["view", "viewing", "saturday", "görebilir", "görmek", "cumartesi"])) intent.push("viewing_request");
  if (includesAny(text, ["available", "availability", "müsait", "uygun"])) intent.push("availability_question");
  if (includesAny(text, ["parking", "driveway", "otopark", "araç yolu"])) intent.push("parking_question");
  if (includesAny(text, ["valuation", "selling", "sell", "değerleme", "satmayı", "satış"])) intent.push("valuation_request");
  if (includesAny(text, ["looking for", "budget", "do you have", "arıyorum", "bütçe", "var mı"])) intent.push("rental_search");
  if (text.includes("500") && !includesAny(text, ["pcm", "pw", "per week", "per month", "aylık", "haftalık"])) intent.push("budget_period_clarification");
  return intent.length ? intent : ["general_enquiry"];
}

export function findCandidateProperties(message: CustomerMessage, properties: Property[]) {
  const text = `${message.message} ${message.propertyReference ?? ""}`.toLowerCase();
  return properties
    .map((property) => {
      let score = 0;
      if (text.includes(property.location.toLowerCase())) score += 0.35;
      if (text.includes(property.title.toLowerCase())) score += 0.35;
      if (text.includes(`${property.bedrooms}-bed`)) score += 0.2;
      if (text.includes(property.type.toLowerCase())) score += 0.1;
      if (message.propertyReference === property.title) score += 0.35;
      return { property, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function selectBestPropertyMatch(message: CustomerMessage, properties: Property[]) {
  const [best] = findCandidateProperties(message, properties);
  if (!best) return { property: null, confidence: 0.38 };
  return {
    property: best.property,
    confidence: Math.min(0.92, Math.max(0.58, best.score)),
  };
}

export function detectMissingFields(property: Property | null) {
  if (!property) return [];
  const fields: string[] = [];
  if (!property.parking) fields.push("parking_info");
  if (!property.epc) fields.push("epc_rating");
  if (!property.councilTax) fields.push("council_tax_band");
  if (!property.tenure) fields.push("tenure");
  return fields;
}

export function buildMaterialInfoCheck(property: Property | null, locale: Locale): MaterialInfoItem[] {
  if (!property) {
    return [
      {
        field: "Availability",
        status: "missing",
        detail: locale === "tr" ? "İlan eşleşmesi doğrulanmalı." : "Property match requires verification.",
        requiresVerification: true,
      },
    ];
  }

  const missing = locale === "tr" ? "Eksik - doğrulama gerekli" : "Missing - verification required";
  const notApplicable = locale === "tr" ? "Bu ilan için uygulanmıyor" : "Not applicable for this listing";
  const updated = locale === "tr" ? `${property.lastUpdatedHoursAgo} saat önce güncellendi` : `Updated ${property.lastUpdatedHoursAgo}h ago`;
  const stale = locale === "tr" ? `${property.lastUpdatedHoursAgo} saat önce güncellendi - kontrol et` : `Updated ${property.lastUpdatedHoursAgo}h ago - verify before sending`;
  const isSale = property.price.includes("£") && !property.price.toLowerCase().includes("pcm");

  return [
    { field: "EPC", status: property.epc ? "verified" : "missing", detail: property.epc ?? missing, requiresVerification: !property.epc },
    {
      field: "Council Tax",
      status: property.councilTax ? "verified" : "missing",
      detail: property.councilTax ?? missing,
      requiresVerification: !property.councilTax,
    },
    { field: "Parking", status: property.parking ? "verified" : "missing", detail: property.parking ?? missing, requiresVerification: !property.parking },
    {
      field: "Service Charge",
      status: property.serviceCharge ? "verified" : isSale ? "missing" : "not_applicable",
      detail: property.serviceCharge ?? (isSale ? missing : notApplicable),
      requiresVerification: isSale && !property.serviceCharge,
    },
    {
      field: "Ground Rent",
      status: property.groundRent ? "verified" : property.tenure === "Leasehold" && isSale ? "missing" : "not_applicable",
      detail: property.groundRent ?? (property.tenure === "Leasehold" && isSale ? missing : notApplicable),
      requiresVerification: property.tenure === "Leasehold" && isSale && !property.groundRent,
    },
    {
      field: "Availability",
      status: property.lastUpdatedHoursAgo > 24 ? "stale" : "updated",
      detail: property.lastUpdatedHoursAgo > 24 ? stale : updated,
      requiresVerification: property.lastUpdatedHoursAgo > 24 || property.availability !== "available",
    },
    { field: "Tenure", status: property.tenure ? "verified" : "missing", detail: property.tenure ?? missing, requiresVerification: !property.tenure },
  ];
}

export function buildRiskFlags(message: CustomerMessage, property: Property | null, confidence: number, missingFields: string[]): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (missingFields.includes("parking_info")) {
    flags.push({ code: "parking_info_missing", label: "Parking information is missing", severity: "high" });
  }
  if (property && property.lastUpdatedHoursAgo > 24) {
    flags.push({ code: "availability_may_be_stale", label: "Availability was last updated over 24 hours ago", severity: "medium" });
  }
  if (property?.availability === "under_offer") {
    flags.push({ code: "property_under_offer", label: "Matched property is currently under offer", severity: "medium" });
  }
  if (message.message.toLowerCase().includes("budget is about 500")) {
    flags.push({ code: "pcm_pw_ambiguity", label: "Budget period is unclear: pcm or per week", severity: "medium" });
  }
  if (confidence < 0.7) {
    flags.push({ code: "low_match_confidence", label: "Property match needs human confirmation", severity: "high" });
  }
  return flags;
}

export function inferConfidenceLevel(confidence: number, property: Property | null, missingFields: string[], riskFlags: RiskFlag[]): ActionCard["confidenceLevel"] {
  const hasUnavailableStatus = property?.availability === "under_offer" || property?.availability === "let_agreed" || property?.availability === "sold";
  const hasStaleData = Boolean(property && property.lastUpdatedHoursAgo > 24);
  if (!property || confidence < 0.7 || hasUnavailableStatus || riskFlags.some((flag) => flag.code === "low_match_confidence")) return "low";
  if (missingFields.length || hasStaleData || confidence < 0.82) return "medium";
  return "high";
}

export function buildWhyFlagged(message: CustomerMessage, property: Property | null, missingFields: string[], riskFlags: RiskFlag[], locale: Locale) {
  const intent = extractIntent(message);
  const items: string[] = [];
  if (intent.includes("parking_question")) items.push(locale === "tr" ? "Müşteri otopark bilgisini sordu." : "Customer asked about parking.");
  if (intent.includes("viewing_request")) items.push(locale === "tr" ? "Evi görme niyeti tespit edildi." : "Viewing intent detected.");
  if (intent.includes("valuation_request")) items.push(locale === "tr" ? "Değerleme fırsatı tespit edildi." : "Valuation opportunity detected.");
  if (missingFields.includes("parking_info")) items.push(locale === "tr" ? "Otopark bilgisi eksik." : "Parking information is missing.");
  if (missingFields.includes("epc_rating")) items.push(locale === "tr" ? "EPC bilgisi eksik." : "EPC information is missing.");
  if (property && property.lastUpdatedHoursAgo > 24) items.push(locale === "tr" ? "İlan müsaitliği güncel değil." : "Listing availability is stale.");
  if (riskFlags.some((flag) => flag.code === "property_under_offer")) items.push(locale === "tr" ? "Eşleşen ilan teklif sürecinde." : "Matched listing is under offer.");
  if (riskFlags.some((flag) => flag.code === "pcm_pw_ambiguity")) items.push(locale === "tr" ? "Bütçe pcm/pw olarak belirsiz." : "Budget is ambiguous between pcm and pw.");
  return items.length ? items : [locale === "tr" ? "Mesaj insan onaylı operasyonel aksiyon gerektiriyor." : "Message needs a human-approved operational next step."];
}

export function detectOpportunityInsights(message: CustomerMessage, locale: Locale): OpportunityInsight[] {
  const text = message.message.toLowerCase();
  if (!includesAny(text, ["sell our current home", "selling our current home", "before moving", "mevcut evimizi sat"])) return [];
  return [
    {
      label: locale === "tr" ? "Potansiyel değerleme fırsatı" : "Potential valuation opportunity detected",
      detail:
        locale === "tr"
          ? "Müşteri taşınmadan önce mevcut evini satabileceğini belirtti; değerleme görüşmesi ikincil insight olarak önerilmeli."
          : "Customer mentioned selling their current home before moving; offer a valuation conversation as a secondary insight.",
      priority: "high",
    },
  ];
}

export function findAlternativeMatches(property: Property | null, properties: Property[], locale: Locale): AlternativeMatch[] {
  if (!property || !["under_offer", "let_agreed", "sold"].includes(property.availability)) return [];
  return properties
    .filter((candidate) => candidate.id !== property.id && candidate.availability === "available")
    .map((candidate) => ({
      property: candidate,
      score:
        (candidate.location === property.location ? 0.45 : 0) +
        (candidate.bedrooms === property.bedrooms ? 0.3 : 0) +
        (candidate.type === property.type ? 0.15 : 0),
    }))
    .filter((candidate) => candidate.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ property: candidate }) => {
      const localized = getLocalizedProperty(candidate, locale);
      return {
        id: candidate.id,
        title: localized.title,
        location: localized.location,
        price: candidate.price,
        availability: candidate.availability,
        reason:
          locale === "tr"
            ? `${localized.location} içinde benzer ${candidate.bedrooms || 1} odalı seçenek.`
            : `Similar ${candidate.bedrooms || 1}-bed option in ${localized.location}.`,
      };
    });
}

function inferCustomerType(message: CustomerMessage): ActionCard["customerType"] {
  const text = message.message.toLowerCase();
  if (includesAny(text, ["selling", "sell", "valuation", "satmayı", "değerleme"])) return "seller";
  if (includesAny(text, ["rent", "pcm", "tenant", "flat", "studio", "kiralık", "daire", "stüdyo"])) return "tenant";
  if (includesAny(text, ["buy", "purchase", "satın"])) return "buyer";
  return "unknown";
}

function inferTemperature(intent: string[], confidence: number): ActionCard["leadTemperature"] {
  if (intent.includes("viewing_request") || intent.includes("valuation_request")) return "hot";
  if (confidence > 0.65 || intent.includes("rental_search")) return "warm";
  return "cold";
}

function meaningfulBriefingEvents(activityLog: ActivityEvent[]) {
  return activityLog.filter((event) => event.type !== "briefing_generated" && event.type !== "message_selected");
}

function countEvents(activityLog: ActivityEvent[], types: ActivityEvent["type"][]) {
  return activityLog.filter((event) => types.includes(event.type)).length;
}

function leadNameForEvent(event: ActivityEvent, messages: CustomerMessage[], locale: Locale) {
  if (event.customerName) return event.customerName;
  const message = messages.find((item) => item.id === event.messageId);
  return message ? message.leadName : locale === "tr" ? "Bilinmeyen müşteri" : "Unknown lead";
}

function buildEodFallbackFromActivity(messages: CustomerMessage[], locale: Locale, activityLog: ActivityEvent[]): Briefing | null {
  const events = meaningfulBriefingEvents(activityLog);
  if (!events.length) {
    return {
      type: "eod",
      title: locale === "tr" ? "Gün Sonu Operasyon Özeti" : "End-of-Day Operational Recap",
      summary:
        locale === "tr"
          ? "Bugün için anlamlı kullanıcı aksiyonu kaydı yok. Özet, aksiyon kartı üretimi, onay, gönderim, takip ve CRM kayıtları oluştuğunda gün içi işi temel alarak hazırlanır."
          : "No meaningful user actions are recorded yet. Once action cards, approvals, sends, follow-ups and CRM notes exist, the recap will be based on the actual work completed today.",
      priorities: [
        locale === "tr" ? "Önce lead seçip aksiyon kartı oluştur." : "Start by generating action cards for selected leads.",
        locale === "tr" ? "Gönderilecek cevapları insan onayından geçir." : "Review customer replies before sending.",
      ],
      risks: [locale === "tr" ? "Aktivite kaydı olmadan gün sonu özeti operasyonel sonuç çıkaramaz." : "Without activity log events, the end-of-day recap cannot infer operational outcomes."],
      recommendedActions: [locale === "tr" ? "Gün sonu özetini, birkaç gerçek aksiyon kaydı oluştuktan sonra yeniden üret." : "Generate the end-of-day recap again after a few real workflow actions."],
      source: "fallback",
    };
  }

  const touchedLeadNames = Array.from(new Set(events.map((event) => leadNameForEvent(event, messages, locale)))).slice(0, 6);
  const actionCards = countEvents(events, ["action_card_generated"]);
  const approvals = countEvents(events, ["reply_approved", "reply_edited"]);
  const sent = countEvents(events, ["agent_message_sent", "offer_sent"]);
  const customerReplies = countEvents(events, ["customer_reply_received"]);
  const followUps = countEvents(events, ["follow_up_created"]);
  const listingFlags = countEvents(events, ["listing_marked"]);
  const crmNotes = countEvents(events, ["crm_note_saved"]);

  const grouped = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const lead = leadNameForEvent(event, messages, locale);
    grouped.set(lead, [...(grouped.get(lead) ?? []), event]);
  }

  const openItems = Array.from(grouped.entries()).flatMap(([lead, leadEvents]) => {
    const types = new Set(leadEvents.map((event) => event.type));
    const items: string[] = [];
    if ((types.has("reply_approved") || types.has("reply_edited")) && !types.has("agent_message_sent") && !types.has("offer_sent")) {
      items.push(locale === "tr" ? `${lead}: onaylanan taslak henüz gönderilmedi.` : `${lead}: approved draft has not been sent.`);
    }
    if ((types.has("agent_message_sent") || types.has("offer_sent")) && !types.has("customer_reply_received")) {
      items.push(locale === "tr" ? `${lead}: müşteri cevabı bekleniyor.` : `${lead}: waiting for customer response.`);
    }
    if (types.has("listing_marked")) {
      items.push(locale === "tr" ? `${lead}: işaretlenen ilan bilgisi doğrulanmalı.` : `${lead}: flagged listing information needs verification.`);
    }
    if ((types.has("agent_message_sent") || types.has("customer_reply_received") || types.has("listing_marked")) && !types.has("follow_up_created")) {
      items.push(locale === "tr" ? `${lead}: takip görevi eksik.` : `${lead}: follow-up task is missing.`);
    }
    return items;
  });

  return {
    type: "eod",
    title: locale === "tr" ? "Gün Sonu Operasyon Özeti" : "End-of-Day Operational Recap",
    summary:
      locale === "tr"
        ? `Bugün ${touchedLeadNames.length} lead üzerinde ${events.length} operasyon kaydı oluştu: ${actionCards} aksiyon kartı, ${approvals} onay/düzenleme, ${sent} gönderim, ${customerReplies} müşteri cevabı, ${followUps} takip ve ${crmNotes} CRM notu.`
        : `Today logged ${events.length} operational actions across ${touchedLeadNames.length} leads: ${actionCards} action cards, ${approvals} approvals/edits, ${sent} sends, ${customerReplies} customer replies, ${followUps} follow-ups and ${crmNotes} CRM notes.`,
    priorities:
      openItems.length
        ? openItems.slice(0, 4)
        : [
            locale === "tr"
              ? `Bugün dokunulan lead'ler: ${touchedLeadNames.join(", ")}.`
              : `Leads touched today: ${touchedLeadNames.join(", ")}.`,
            locale === "tr" ? "Açık kritik aksiyon görünmüyor; yarın sıcak lead'lerden devam et." : "No critical open action is visible; continue tomorrow with hot leads.",
          ],
    risks: [
      ...(listingFlags
        ? [locale === "tr" ? `${listingFlags} ilan bilgisi doğrulama için işaretlendi; doğrulanmadan kesin müşteri cevabı gönderme.` : `${listingFlags} listing information items were flagged; do not send firm claims before verification.`]
        : []),
      ...(sent > customerReplies
        ? [locale === "tr" ? `${sent - customerReplies} gönderim için müşteri cevabı bekleniyor.` : `${sent - customerReplies} sent messages are still waiting for customer response.`]
        : []),
      ...(openItems.length ? [] : [locale === "tr" ? "Kayda göre kapatılmamış kritik risk görünmüyor." : "No unresolved critical risk is visible from the activity log."]),
    ],
    recommendedActions: [
      ...(openItems.length ? openItems.slice(0, 3) : []),
      followUps === 0
        ? locale === "tr"
          ? "Yarın başlamadan önce sıcak lead'ler için takip görevlerini oluştur."
          : "Create follow-up tasks for hot leads before starting tomorrow."
        : locale === "tr"
          ? "Yarın ilk iş açık takipleri kontrol et ve müşteri cevabı bekleyenleri sırala."
          : "Tomorrow, review open follow-ups first and sort leads waiting for customer response.",
    ],
    operatingInsights: [
      locale === "tr"
        ? `En çok işlem gören lead'ler: ${touchedLeadNames.join(", ")}.`
        : `Most active leads: ${touchedLeadNames.join(", ")}.`,
      locale === "tr"
        ? `Workflow dağılımı: ${sent} gönderim, ${followUps} takip, ${crmNotes} CRM notu.`
        : `Workflow mix: ${sent} sends, ${followUps} follow-ups, ${crmNotes} CRM notes.`,
    ],
    unresolvedItems: openItems.slice(0, 6),
    source: "fallback",
  };
}

export function generateFallbackActionCard(message: CustomerMessage, properties: Property[], locale: Locale = "en"): ActionCard {
  const intent = extractIntent(message);
  const match = selectBestPropertyMatch(message, properties);
  const missingFields = detectMissingFields(match.property);
  const riskFlags = buildRiskFlags(message, match.property, match.confidence, missingFields);
  const materialInfoCheck = buildMaterialInfoCheck(match.property, locale);
  const alternativeMatches = findAlternativeMatches(match.property, properties, locale);
  const opportunityInsights = detectOpportunityInsights(message, locale);
  const customerType = inferCustomerType(message);
  const leadTemperature = inferTemperature(intent, match.confidence);
  const matchedProperty = match.property
    ? {
        id: match.property.id,
        title: getLocalizedProperty(match.property, locale).title,
        location: getLocalizedProperty(match.property, locale).location,
      }
    : null;

  let suggestedReply =
    locale === "tr"
      ? "Mesajınız için teşekkürler. İlgili detayları kontrol edip size doğru bilgiyle kısa süre içinde döneceğim."
      : "Thanks for your message. I will check the relevant details and come back to you with accurate information shortly.";
  let suggestedFollowUp =
    locale === "tr"
      ? "Talebi gözden geçir ve bugün atılacak en doğru aksiyonu netleştir."
      : "Review the enquiry and confirm the next best action today.";
  let suggestedListingAction =
    missingFields.length
      ? locale === "tr"
        ? "Eksik ilan alanlarını doğruladıktan sonra güncelle."
        : "Update missing listing fields after verification."
      : locale === "tr"
        ? "Şu anda ilan güncellemesi gerekmiyor."
        : "No listing update needed right now.";

  if (message.id === "msg_sarah_colchester") {
    suggestedReply =
      locale === "tr"
        ? "Merhaba Selin, mesajınız için teşekkürler. Colchester'daki daire sistemde şu anda müsait görünüyor; cumartesi günü evi görme randevusu için uygun saatleri sizin için kontrol edebilirim. Otopark bilgisini de tahmin etmek yerine doğruluyorum, böylece size doğru bilgi verebilirim. Uygun saatler ve doğrulanmış otopark bilgisiyle kısa süre içinde döneceğim."
        : "Hi Sarah, thanks for your message. The Colchester flat is currently showing as available, and I can check Saturday viewing options for you. I am also confirming the parking details so I can give you accurate information rather than guessing. I will come back shortly with the available times and confirmed parking information.";
    suggestedFollowUp =
      locale === "tr"
        ? "Bugün otopark bilgisini ve cumartesi günkü evi görme randevusu saatlerini doğrula."
        : "Confirm parking details and available Saturday viewing slots today.";
    suggestedListingAction =
      locale === "tr"
        ? "Doğrulama sonrası otopark bilgisini ilan kaydına ekle."
        : "Update the parking information field after verification.";
  } else if (intent.includes("valuation_request")) {
    suggestedReply =
      locale === "tr"
        ? "Merhaba Mert, iletişime geçtiğiniz için teşekkürler. Essex'teki eviniz için tahmini değerleme konusunda yardımcı olabilir ve evi, zamanlamanızı daha iyi anlamak için kısa bir görüşme planlayabiliriz. Değerleme görüşmesi için size uygun zaman nedir?"
        : "Hi James, thanks for getting in touch. We can help with an estimated valuation for your Essex property and arrange a short call to understand the house and your timing. What would be a convenient time for a valuation call?";
    suggestedFollowUp =
      locale === "tr" ? "Değerleme görüşmesi planla ve satıcı zamanlamasını müşteri kaydına işle." : "Book valuation call and capture seller timeline in CRM.";
    suggestedListingAction =
      locale === "tr" ? "Değerleme detayları netleşene kadar ilan aksiyonu gerekmiyor." : "No listing action until valuation details are confirmed.";
  } else if (riskFlags.some((flag) => flag.code === "property_under_offer")) {
    suggestedReply =
      locale === "tr"
        ? "Merhaba Derya, talebiniz için teşekkürler. Bütçenize uyan Bristol dairesi şu anda teklif sürecinde görünüyor; kontrol etmeden müsaitmiş gibi paylaşmak istemem. Bu ilanla ilgili sizi güncel tutabilir ve şehir merkezine yakın benzer 1 odalı seçenekleri kontrol edebilirim."
        : "Hi Priya, thanks for your enquiry. The Bristol flat that matches your budget is currently under offer, so I would not want to present it as available without checking. I can keep you updated on that property and look for similar 1-bed options near the city centre.";
    suggestedFollowUp =
      locale === "tr" ? "Bristol alternatiflerini kontrol et ve benzer müsait ilanlarla dönüş yap." : "Check Bristol alternatives and follow up with similar available listings.";
    suggestedListingAction = locale === "tr" ? "Bristol ilanındaki EPC bilgisini güncelle." : "Update EPC rating for the Bristol listing.";
  } else if (opportunityInsights.length) {
    suggestedReply =
      locale === "tr"
        ? "Merhaba Ece, mesajınız için teşekkürler. Essex eviyle ilgili detayları paylaşabiliriz ve sonraki adımları netleştirebiliriz. Mevcut evinizi satma ihtimaliniz varsa, ayrıca kısa bir değerleme görüşmesi ayarlayarak satış ve taşınma zamanlamasını birlikte planlayabiliriz."
        : "Hi Emma, thanks for your message. We can send the details for the Essex house and outline the next steps. As you may sell your current home before moving, we can also arrange a short valuation conversation to help plan the sale and move timeline together.";
    suggestedFollowUp =
      locale === "tr"
        ? "Essex detaylarını gönder ve mevcut ev için değerleme görüşmesi fırsatını takip et."
        : "Send Essex details and follow up on the valuation opportunity for the current home.";
    suggestedListingAction = locale === "tr" ? "İlan aksiyonu yok; satış fırsatını CRM'e işaretle." : "No listing action; flag the valuation opportunity in CRM.";
  } else if (riskFlags.some((flag) => flag.code === "pcm_pw_ambiguity")) {
    suggestedReply =
      locale === "tr"
        ? "Merhaba Emre, mesajınız için teşekkürler. Doğru arama yapabilmem için £500 bütçeniz aylık mı, haftalık mı? Bunu netleştirdikten sonra Manchester için uygun seçenekleri kontrol edebilirim."
        : "Hi Ahmed, thanks for your message. Just to make sure I search accurately, is your £500 budget per month or per week? Once confirmed, I can check suitable Manchester options.";
    suggestedFollowUp =
      locale === "tr" ? "Manchester daireleri önermeden önce bütçe dönemini netleştir." : "Clarify budget period before recommending Manchester flats.";
    suggestedListingAction =
      locale === "tr" ? "Bütçe dönemi netleşene kadar ilan aksiyonu gerekmiyor." : "No listing action until budget period is confirmed.";
  }

  return {
    messageId: message.id,
    intent,
    customerType,
    leadTemperature,
    matchedProperty,
    confidence: message.id === "msg_sarah_colchester" ? 0.86 : Number(match.confidence.toFixed(2)),
    confidenceLevel: inferConfidenceLevel(message.id === "msg_sarah_colchester" ? 0.86 : match.confidence, match.property, missingFields, riskFlags),
    missingFields,
    materialInfoCheck,
    riskFlags,
    whyFlagged: buildWhyFlagged(message, match.property, missingFields, riskFlags, locale),
    suggestedReply,
    suggestedCrmNote:
      locale === "tr"
        ? `${message.leadName}, "${message.subject}" hakkında yazdı. ${
            matchedProperty ? `${matchedProperty.title} ile eşleşti.` : "İlan eşleşmesi onay gerektiriyor."
          }`
        : `${message.leadName} asked about ${message.subject.toLowerCase()}. ${
            matchedProperty ? `Matched to ${matchedProperty.title}.` : "Property match needs confirmation."
          }`,
    suggestedFollowUp,
    suggestedListingAction,
    suggestedNextAction:
      match.property?.availability === "under_offer"
        ? locale === "tr"
          ? "Benzer iki yakın ilan öner."
          : "Offer two similar nearby listings."
        : opportunityInsights.length
          ? locale === "tr"
            ? "Değerleme fırsatını ikincil insight olarak danışmana göster."
            : "Surface the valuation opportunity as a secondary insight."
          : undefined,
    alternativeMatches,
    opportunityInsights,
    approvalStatus: "pending",
    replyRiskLocked: match.confidence < 0.7 || materialInfoCheck.some((item) => item.requiresVerification),
    source: "fallback",
  };
}

export function generateFallbackBriefing(
  type: "morning" | "eod",
  messages: CustomerMessage[],
  properties: Property[],
  locale: Locale = "en",
  activityLog: ActivityEvent[] = [],
): Briefing {
  const stale = properties.filter((property) => property.lastUpdatedHoursAgo > 24);
  const missing = properties.filter((property) => !property.parking || !property.epc || !property.councilTax);
  const hotLeads = messages.filter((message) => message.initialTemperature === "hot");
  const waitingForReply = messages.filter((message) => message.status === "new");
  const valuationOpportunities = messages.filter((message) => {
    const intent = extractIntent(message);
    return intent.includes("valuation_request") || detectOpportunityInsights(message, locale).length > 0;
  });
  const overdueFollowUps = messages.filter((message) => message.status === "reviewing" || message.id === "msg_peter_decisive");
  const activityBasedEod = type === "eod" ? buildEodFallbackFromActivity(messages, locale, activityLog) : null;

  if (activityBasedEod) return activityBasedEod;

  if (type === "morning") {
    return {
      type,
      title: locale === "tr" ? "Bugünün Operasyon Özeti" : "Today's Operational Briefing",
      summary:
        locale === "tr"
          ? `${waitingForReply.length} müşteri cevap bekliyor, ${missing.length} ilanda material information eksik, ${valuationOpportunities.length} değerleme fırsatı ve ${overdueFollowUps.length} gecikmiş takip var.`
          : `${waitingForReply.length} leads waiting for reply, ${missing.length} listings missing material information, ${valuationOpportunities.length} valuation opportunities and ${overdueFollowUps.length} overdue follow-ups.`,
      priorities:
        locale === "tr"
          ? [
              `${waitingForReply.length} cevap bekleyen talebi öncelik sırasına al.`,
              `${missing.length} ilandaki EPC, otopark veya council tax eksiklerini doğrula.`,
              `${valuationOpportunities.length} değerleme fırsatını danışman takibine çıkar.`,
            ]
          : [
              `${waitingForReply.length} leads waiting for reply.`,
              `${missing.length} listings missing material information.`,
              `${valuationOpportunities.length} valuation opportunities detected.`,
            ],
      risks: stale.map((property) =>
        locale === "tr"
          ? `${getLocalizedProperty(property, "tr").title} müsaitlik bilgisi ${property.lastUpdatedHoursAgo} saat önce güncellendi.`
          : `${property.title} availability data is ${property.lastUpdatedHoursAgo} hours old.`,
      ),
      recommendedActions:
        locale === "tr"
          ? [`${overdueFollowUps.length} gecikmiş takibi kapat.`, "İlan verisi doğrulanmadan otopark veya müsaitlik bilgisini kesin ifade etme."]
          : [`Clear ${overdueFollowUps.length} overdue follow-ups.`, "Do not send final parking or availability claims until listing data is verified."],
      source: "fallback",
    };
  }

  return {
    type,
    title: locale === "tr" ? "Gün Sonu Özeti" : "End-of-Day Recap",
    summary:
      locale === "tr"
        ? "Bugün gelen mesajları incelenmiş cevaplara, müşteri kayıt notlarına ve takip görevlerine dönüştürmeye odaklanıldı."
        : "Today focused on turning inbound messages into reviewed replies, CRM notes and follow-up tasks.",
    priorities:
      locale === "tr"
        ? ["Selin A. hâlâ otopark doğrulaması ve evi görme randevusu saatlerini bekliyor.", "Bristol ilanında EPC bilgisi eksik.", "Manchester müşteri talebi için bütçe dönemi netleştirilmeli."]
        : [
            "Sarah M. is still waiting for confirmed parking and viewing slots.",
            "Bristol listing still needs EPC information.",
            "Warm Manchester lead needs budget clarification.",
          ],
    risks:
      locale === "tr"
        ? ["Doğrulanmamış ilan bilgileri kesin bilgi gibi gönderilmemeli.", "Takip edilmeyen orta öncelikli müşteri talepleri soğuyabilir."]
        : ["Unverified listing information should not be sent as fact.", "Warm leads may go cold without follow-up."],
    recommendedActions:
      locale === "tr"
        ? ["Yarın çözülmemiş yüksek öncelikli müşteri talepleriyle başla.", "Müşteriye son cevap gönderilmeden önce eksik ilan alanlarını doğrula."]
        : ["Begin tomorrow with unresolved hot leads.", "Verify missing listing fields before sending final customer replies."],
    source: "fallback",
  };
}
