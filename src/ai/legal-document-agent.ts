import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { LegalDocumentRule, LegalDocumentRuleField, LegalDocumentSource, Locale } from "@/src/types";
import { generateGeminiJson, generateGeminiJsonWithPdf, hasGeminiApiKey } from "./gemini-client";

const LEGAL_DIRECTORY = path.join(process.cwd(), "data", "legal");
const PDF_FILE = "yasalar.pdf";
const TEXT_FILE = "yasalar.txt";

type LegalRulesPayload = {
  summary?: string;
  rules?: Partial<LegalDocumentRule>[];
};

const supportedFields: LegalDocumentRuleField[] = [
  "EPC",
  "Council Tax",
  "Parking",
  "Service Charge",
  "Ground Rent",
  "Availability",
  "Tenure",
  "Lease Length",
  "Other",
];

export async function loadLegalDocumentRules(locale: Locale): Promise<LegalDocumentSource> {
  const checkedAt = new Date().toISOString();
  const pdfPath = path.join(LEGAL_DIRECTORY, PDF_FILE);
  const textPath = path.join(LEGAL_DIRECTORY, TEXT_FILE);

  if (existsSync(pdfPath)) {
    const updatedAt = statSync(pdfPath).mtime.toISOString();
    if (!hasGeminiApiKey()) {
      return {
        status: "ai_unavailable",
        fileName: PDF_FILE,
        summary:
          locale === "tr"
            ? "yasalar.pdf bulundu, ancak GEMINI_API_KEY olmadığı için PDF içeriği okunamadı. Sistem yerleşik kontrollerle devam etti."
            : "yasalar.pdf was found, but GEMINI_API_KEY is missing, so the PDF could not be read. Built-in checks were used.",
        rules: [],
        checkedAt,
        updatedAt,
      };
    }

    const payload = await generateGeminiJsonWithPdf<LegalRulesPayload>(buildLegalExtractionPrompt(locale), readFileSync(pdfPath));
    return buildSourceFromPayload(payload, PDF_FILE, checkedAt, updatedAt, locale);
  }

  if (existsSync(textPath)) {
    const updatedAt = statSync(textPath).mtime.toISOString();
    if (!hasGeminiApiKey()) {
      return buildSourceFromPlainText(readFileSync(textPath, "utf8"), checkedAt, updatedAt, locale);
    }

    const text = readFileSync(textPath, "utf8");
    const payload = await generateGeminiJson<LegalRulesPayload>(`${buildLegalExtractionPrompt(locale)}\n\nLegal text:\n${text.slice(0, 60000)}`);
    return buildSourceFromPayload(payload, TEXT_FILE, checkedAt, updatedAt, locale);
  }

  return {
    status: "missing",
    fileName: PDF_FILE,
    summary:
      locale === "tr"
        ? "data/legal/yasalar.pdf bulunamadı. Sistem yerleşik yasal kontrol listesiyle çalıştı."
        : "data/legal/yasalar.pdf was not found. Built-in legal checks were used.",
    rules: [],
    checkedAt,
  };
}

function buildSourceFromPayload(
  payload: LegalRulesPayload | null,
  fileName: string,
  checkedAt: string,
  updatedAt: string,
  locale: Locale,
): LegalDocumentSource {
  const rules = cleanRules(payload?.rules ?? []);
  if (!payload || !rules.length) {
    return {
      status: "unreadable",
      fileName,
      summary:
        locale === "tr"
          ? `${fileName} okundu fakat emlak ilanı denetimine çevrilebilecek net kural çıkarılamadı. Sistem yerleşik kontrollerle devam etti.`
          : `${fileName} was read, but no clear listing-audit rules could be extracted. Built-in checks were used.`,
      rules: [],
      checkedAt,
      updatedAt,
    };
  }

  return {
    status: "loaded",
    fileName,
    summary: payload.summary?.trim() || (locale === "tr" ? `${fileName} kaynak alınarak yasal kontrol kuralları çıkarıldı.` : `Legal audit rules were extracted from ${fileName}.`),
    rules,
    checkedAt,
    updatedAt,
  };
}

function buildSourceFromPlainText(text: string, checkedAt: string, updatedAt: string, locale: Locale): LegalDocumentSource {
  const lower = text.toLowerCase();
  const rules: LegalDocumentRule[] = [];

  addHeuristicRule(rules, lower, "epc", "EPC", locale);
  addHeuristicRule(rules, lower, "council tax", "Council Tax", locale);
  addHeuristicRule(rules, lower, "parking", "Parking", locale);
  addHeuristicRule(rules, lower, "service charge", "Service Charge", locale, "leasehold sale listings");
  addHeuristicRule(rules, lower, "ground rent", "Ground Rent", locale, "leasehold sale listings");
  addHeuristicRule(rules, lower, "tenure", "Tenure", locale);
  addHeuristicRule(rules, lower, "lease", "Lease Length", locale, "leasehold sale listings");
  addHeuristicRule(rules, lower, "availability", "Availability", locale);

  return {
    status: rules.length ? "loaded" : "unreadable",
    fileName: TEXT_FILE,
    summary: rules.length
      ? locale === "tr"
        ? "yasalar.txt içinden temel ilan kontrol kuralları çıkarıldı."
        : "Basic listing audit rules were extracted from yasalar.txt."
      : locale === "tr"
        ? "yasalar.txt bulundu fakat net ilan kuralı çıkarılamadı."
        : "yasalar.txt was found, but no clear listing rules could be extracted.",
    rules,
    checkedAt,
    updatedAt,
  };
}

function addHeuristicRule(
  rules: LegalDocumentRule[],
  lowerText: string,
  keyword: string,
  field: LegalDocumentRuleField,
  locale: Locale,
  appliesWhen = "all listing types",
) {
  if (!lowerText.includes(keyword)) return;
  rules.push({
    field,
    requirement: locale === "tr" ? `${field} alanı yasal kaynakta önemli ilan bilgisi olarak geçiyor.` : `${field} appears in the legal source as material listing information.`,
    severity: field === "Availability" ? "medium" : "high",
    blocksPublish: true,
    appliesWhen,
    evidence: keyword,
  });
}

function cleanRules(items: Partial<LegalDocumentRule>[]): LegalDocumentRule[] {
  const rules = items
    .map((item): LegalDocumentRule | null => {
      const field = supportedFields.includes(item.field as LegalDocumentRuleField) ? (item.field as LegalDocumentRuleField) : "Other";
      const requirement = typeof item.requirement === "string" ? item.requirement.trim() : "";
      if (!requirement) return null;
      const rule: LegalDocumentRule = {
        field,
        requirement,
        severity: item.severity === "low" || item.severity === "medium" || item.severity === "high" ? item.severity : "medium",
        blocksPublish: item.blocksPublish !== false,
      };
      if (typeof item.appliesWhen === "string") rule.appliesWhen = item.appliesWhen;
      if (typeof item.evidence === "string") rule.evidence = item.evidence.slice(0, 220);
      return rule;
    })
    .filter((item): item is LegalDocumentRule => item !== null);

  return rules.slice(0, 24);
}

function buildLegalExtractionPrompt(locale: Locale) {
  return `
You are a legal-document extraction sub-agent for a UK estate agency compliance system.
Read the provided legal source and extract only practical listing-audit rules that can be checked against property listing fields.
Write summary, requirement and evidence in ${locale === "tr" ? "Turkish" : "English"}.

Supported fields:
- EPC
- Council Tax
- Parking
- Service Charge
- Ground Rent
- Availability
- Tenure
- Lease Length
- Other

Return only JSON:
{
  "summary": "short source summary",
  "rules": [
    {
      "field": "EPC|Council Tax|Parking|Service Charge|Ground Rent|Availability|Tenure|Lease Length|Other",
      "requirement": "plain rule the system should check",
      "severity": "low|medium|high",
      "blocksPublish": true,
      "appliesWhen": "all listings|sales listings|rental listings|leasehold sale listings|...",
      "evidence": "short supporting phrase from the document, not a long quote"
    }
  ]
}

Rules:
- Do not invent law that is not in the document.
- Do not provide legal advice.
- Ignore broad background text that cannot be checked against listing data.
- Mark missing material information as high severity when it can affect publishing or customer-facing claims.
- Use "Other" only when the document clearly creates a listing obligation but the field is not supported.
`;
}
