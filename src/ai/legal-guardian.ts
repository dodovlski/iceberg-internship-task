import { demoProperties, getLocalizedProperty } from "@/src/data/demo-data";
import type {
  LegalAuditReport,
  LegalDocumentRule,
  LegalDocumentRuleField,
  LegalDocumentSource,
  LegalGuardAction,
  LegalGuardDecision,
  LegalGuardIssue,
  LegalGuardStatus,
  Locale,
  Property,
} from "@/src/types";
import { buildMaterialInfoCheck } from "./fallbacks";
import { loadLegalDocumentRules } from "./legal-document-agent";

const LAW_BASIS = [
  "DMCC Act 2024 - unfair commercial practices",
  "UK material information guidance for property listings",
];

const BLOCKING_ACTIONS: LegalGuardAction[] = ["publish_listing", "portal_sync", "send_customer_reply"];

export function runLegalPreflight(
  action: LegalGuardAction,
  property: Property,
  locale: Locale = "en",
  legalDocument?: LegalDocumentSource,
): LegalGuardDecision {
  const localized = getLocalizedProperty(property, locale);
  const issues = buildListingIssues(property, locale, legalDocument);
  const status = decideStatus(action, issues);

  return {
    status,
    action,
    propertyId: property.id,
    propertyTitle: localized.title,
    summary: buildDecisionSummary(status, localized.title, issues, locale),
    lawBasis: buildLawBasis(legalDocument),
    issues,
    allowedActions: buildAllowedActions(status),
    checkedAt: new Date().toISOString(),
  };
}

export function runWeeklyLegalAudit(
  locale: Locale = "en",
  properties: Property[] = demoProperties,
  legalDocument?: LegalDocumentSource,
): LegalAuditReport {
  const decisions = properties.map((property) => runLegalPreflight("weekly_audit", property, locale, legalDocument));
  const totals = {
    checked: decisions.length,
    pass: decisions.filter((decision) => decision.status === "PASS").length,
    warn: decisions.filter((decision) => decision.status === "WARN").length,
    fail: decisions.filter((decision) => decision.status === "FAIL").length,
  };
  const status: LegalGuardStatus = totals.fail ? "FAIL" : totals.warn ? "WARN" : "PASS";

  return {
    status,
    checkedAt: new Date().toISOString(),
    summary:
      locale === "tr"
        ? `${totals.checked} ilan kontrol edildi: ${totals.fail} kritik eksik, ${totals.warn} uyarı, ${totals.pass} temiz. ${legalDocumentSummary(legalDocument, locale)}`
        : `${totals.checked} listings checked: ${totals.fail} blocked, ${totals.warn} warnings, ${totals.pass} clear. ${legalDocumentSummary(legalDocument, locale)}`,
    totals,
    decisions,
    legalDocument,
  };
}

export async function runWeeklyLegalAuditFromDocument(
  locale: Locale = "en",
  properties: Property[] = demoProperties,
): Promise<LegalAuditReport> {
  const legalDocument = await loadLegalDocumentRules(locale);
  return runWeeklyLegalAudit(locale, properties, legalDocument);
}

function buildListingIssues(property: Property, locale: Locale, legalDocument?: LegalDocumentSource): LegalGuardIssue[] {
  const materialInfo = buildMaterialInfoCheck(property, locale);
  const documentIssues = buildLegalDocumentIssues(property, locale, legalDocument);
  const documentFields = new Set(
    legalDocument?.status === "loaded"
      ? legalDocument.rules.filter((rule) => rule.field !== "Other").map((rule) => rule.field)
      : [],
  );
  const issues: LegalGuardIssue[] = [];
  const isSale = !property.price.toLowerCase().includes("pcm");
  const isLeasehold = property.tenure?.toLowerCase() === "leasehold";

  for (const item of materialInfo) {
    if (!item.requiresVerification) continue;
    if (documentFields.has(item.field)) continue;
    if ((item.field === "Service Charge" || item.field === "Ground Rent") && (!isSale || !isLeasehold)) continue;

    issues.push({
      field: item.field,
      severity: item.status === "missing" ? "high" : "medium",
      reason:
        locale === "tr"
          ? `${item.field} bilgisi eksik veya doğrulama istiyor: ${item.detail}`
          : `${item.field} is missing or needs verification: ${item.detail}`,
      requiredAction: requiredActionForField(item.field, locale),
      blocksPublish: item.status === "missing" || item.field === "Availability",
      source: "built_in",
    });
  }

  if (isLeasehold && isSale && !property.serviceCharge && !documentFields.has("Service Charge")) {
    issues.push({
      field: "Service Charge",
      severity: "high",
      reason: locale === "tr" ? "Leasehold satış ilanında service charge bilgisi net değil." : "Service charge is not clear for a leasehold sale listing.",
      requiredAction: locale === "tr" ? "Service charge bilgisini doğrula ve ilana ekle." : "Verify service charge and add it to the listing.",
      blocksPublish: true,
      source: "built_in",
    });
  }

  if (isLeasehold && isSale && !property.groundRent && !documentFields.has("Ground Rent")) {
    issues.push({
      field: "Ground Rent",
      severity: "high",
      reason: locale === "tr" ? "Leasehold satış ilanında ground rent bilgisi net değil." : "Ground rent is not clear for a leasehold sale listing.",
      requiredAction: locale === "tr" ? "Ground rent bilgisini doğrula ve ilana ekle." : "Verify ground rent and add it to the listing.",
      blocksPublish: true,
      source: "built_in",
    });
  }

  if (isLeasehold && isSale && !property.leaseLength && !documentFields.has("Lease Length")) {
    issues.push({
      field: "Lease Length",
      severity: "high",
      reason: locale === "tr" ? "Leasehold satış ilanında lease length bilgisi net değil." : "Lease length is not clear for a leasehold sale listing.",
      requiredAction: locale === "tr" ? "Lease length bilgisini doğrula ve ilana ekle." : "Verify lease length and add it to the listing.",
      blocksPublish: true,
      source: "built_in",
    });
  }

  return dedupeIssues([...documentIssues, ...issues]);
}

function buildLegalDocumentIssues(property: Property, locale: Locale, legalDocument?: LegalDocumentSource): LegalGuardIssue[] {
  if (legalDocument?.status !== "loaded") return [];

  return legalDocument.rules
    .filter((rule) => rule.field !== "Other")
    .filter((rule) => isRuleRelevant(rule, property))
    .filter((rule) => !isRuleSatisfied(rule.field, property))
    .map((rule) => ({
      field: rule.field,
      severity: rule.severity,
      reason:
        locale === "tr"
          ? `yasalar.pdf kaynağı bu alanı gerekli görüyor: ${rule.requirement}`
          : `yasalar.pdf requires this field: ${rule.requirement}`,
      requiredAction: requiredActionFromRule(rule, locale),
      blocksPublish: rule.blocksPublish,
      source: "legal_document" as const,
      evidence: rule.evidence,
    }));
}

function isRuleRelevant(rule: LegalDocumentRule, property: Property) {
  const appliesWhen = rule.appliesWhen?.toLowerCase() ?? "";
  const isSale = !property.price.toLowerCase().includes("pcm");
  const isRental = !isSale;
  const isLeasehold = property.tenure?.toLowerCase() === "leasehold";

  if ((appliesWhen.includes("sale") || appliesWhen.includes("sales")) && !isSale) return false;
  if ((appliesWhen.includes("rental") || appliesWhen.includes("rent") || appliesWhen.includes("letting")) && !isRental) return false;
  if (appliesWhen.includes("leasehold") && !isLeasehold) return false;
  return true;
}

function isRuleSatisfied(field: LegalDocumentRuleField, property: Property) {
  switch (field) {
    case "EPC":
      return Boolean(property.epc);
    case "Council Tax":
      return Boolean(property.councilTax);
    case "Parking":
      return Boolean(property.parking);
    case "Service Charge":
      return Boolean(property.serviceCharge);
    case "Ground Rent":
      return Boolean(property.groundRent);
    case "Availability":
      return property.availability === "available" && property.lastUpdatedHoursAgo <= 24;
    case "Tenure":
      return Boolean(property.tenure);
    case "Lease Length":
      return Boolean(property.leaseLength);
    default:
      return true;
  }
}

function requiredActionFromRule(rule: LegalDocumentRule, locale: Locale) {
  if (locale === "tr") return `${rule.field} bilgisini yasalar.pdf içindeki kurala göre doğrula ve ilan kaydına ekle.`;
  return `Verify ${rule.field} against yasalar.pdf and add it to the listing record.`;
}

function decideStatus(action: LegalGuardAction, issues: LegalGuardIssue[]): LegalGuardStatus {
  if (!issues.length) return "PASS";
  if (action === "weekly_audit" && issues.some((issue) => issue.blocksPublish)) return "FAIL";
  if (BLOCKING_ACTIONS.includes(action) && issues.some((issue) => issue.blocksPublish)) return "FAIL";
  return "WARN";
}

function buildAllowedActions(status: LegalGuardStatus): LegalGuardAction[] {
  if (status === "PASS") return ["save_draft", "publish_listing", "portal_sync", "send_customer_reply"];
  return ["save_draft"];
}

function buildDecisionSummary(status: LegalGuardStatus, title: string, issues: LegalGuardIssue[], locale: Locale) {
  if (status === "PASS") {
    return locale === "tr" ? `${title} için kritik yasal eksik görünmüyor.` : `${title} has no critical legal gaps.`;
  }

  const high = issues.filter((issue) => issue.severity === "high").length;
  if (status === "FAIL") {
    return locale === "tr"
      ? `${title} yayına alınmadan önce ${high || issues.length} kritik bilgi tamamlanmalı.`
      : `${title} needs ${high || issues.length} critical item(s) completed before publishing.`;
  }

  return locale === "tr"
    ? `${title} taslak olarak kalabilir, ama ${issues.length} alan kontrol edilmeli.`
    : `${title} can stay as a draft, but ${issues.length} item(s) need review.`;
}

function requiredActionForField(field: string, locale: Locale) {
  const actions: Record<string, { en: string; tr: string }> = {
    EPC: { en: "Verify the EPC rating and add it to the listing.", tr: "EPC derecesini doğrula ve ilana ekle." },
    "Council Tax": { en: "Verify the council tax band.", tr: "Council tax bandını doğrula." },
    Parking: { en: "Confirm parking details before making customer-facing claims.", tr: "Müşteriye bilgi vermeden önce otopark bilgisini doğrula." },
    "Service Charge": { en: "Add service charge details where they apply.", tr: "Gerekiyorsa service charge bilgisini ekle." },
    "Ground Rent": { en: "Add ground rent details where they apply.", tr: "Gerekiyorsa ground rent bilgisini ekle." },
    Availability: { en: "Refresh availability before publishing or replying.", tr: "Yayınlamadan veya cevaplamadan önce müsaitlik bilgisini yenile." },
    Tenure: { en: "Confirm tenure before publishing.", tr: "Yayınlamadan önce mülkiyet türünü doğrula." },
    "Lease Length": { en: "Confirm lease length before publishing.", tr: "Yayınlamadan önce lease length bilgisini doğrula." },
  };

  return actions[field]?.[locale] ?? (locale === "tr" ? "Bilgiyi doğrula." : "Verify this information.");
}

function buildLawBasis(legalDocument?: LegalDocumentSource) {
  if (legalDocument?.status === "loaded") return [`Local legal source: ${legalDocument.fileName}`, ...LAW_BASIS];
  return LAW_BASIS;
}

function legalDocumentSummary(legalDocument: LegalDocumentSource | undefined, locale: Locale) {
  if (!legalDocument) return "";
  if (legalDocument.status === "loaded") {
    return locale === "tr"
      ? `Yasal kaynak: ${legalDocument.fileName}, ${legalDocument.rules.length} kural.`
      : `Legal source: ${legalDocument.fileName}, ${legalDocument.rules.length} rules.`;
  }
  return legalDocument.summary;
}

function dedupeIssues(issues: LegalGuardIssue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.source}:${issue.field}:${issue.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
