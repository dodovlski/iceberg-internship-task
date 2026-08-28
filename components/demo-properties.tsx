"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Home,
  Loader2,
  Mic,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Badge, Button, Panel } from "@/components/ui";
import { demoProperties, getLocalizedProperty } from "@/src/data/demo-data";
import { useDemoSession } from "@/src/hooks/use-demo-session";
import { getDictionary } from "@/src/i18n/get-dictionary";
import {
  formatAvailability,
  formatMissingField,
  formatPropertyType,
} from "@/src/i18n/labels";
import type { LegalAuditReport, LegalGuardDecision, ListingUpdateDraft, Locale, Property } from "@/src/types";

type StatusFilter = "all" | "available" | "issues" | "under_offer";

function getMissing(property: Property): string[] {
  return [
    !property.parking ? "parking_info" : null,
    !property.epc ? "epc_rating" : null,
    !property.councilTax ? "council_tax_band" : null,
  ].filter(Boolean) as string[];
}

function isStale(property: Property): boolean {
  return property.lastUpdatedHoursAgo > 24;
}

export function DemoPropertiesInventory({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const demoSession = useDemoSession();
  const [propertyRecords, setPropertyRecords] = useState<Property[]>(demoProperties);
  const [persistenceReady, setPersistenceReady] = useState(!demoSession.configured);
  const properties = useMemo(
    () => propertyRecords.map((property) => getLocalizedProperty(property, locale)),
    [propertyRecords, locale]
  );
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"title" | "price" | "updated">(
    "updated"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [updateTarget, setUpdateTarget] = useState<Property | null>(null);
  const [updateInput, setUpdateInput] = useState("");
  const [updateDraft, setUpdateDraft] = useState<ListingUpdateDraft | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [legalAudit, setLegalAudit] = useState<LegalAuditReport | null>(null);
  const [legalAuditLoading, setLegalAuditLoading] = useState(false);
  const [legalAuditError, setLegalAuditError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!demoSession.configured) {
      setPersistenceReady(true);
      return;
    }
    if (demoSession.status !== "ready") return;

    let cancelled = false;

    async function loadPersistedListings() {
      try {
        const persisted = await demoSession.loadState<{ propertyRecords?: Property[] }>("listings");
        if (cancelled) return;
        if (Array.isArray(persisted?.propertyRecords)) {
          setPropertyRecords(persisted.propertyRecords);
        }
      } catch (caught) {
        if (!cancelled) setLegalAuditError(caught instanceof Error ? caught.message : "Could not load listing state.");
      } finally {
        if (!cancelled) setPersistenceReady(true);
      }
    }

    void loadPersistedListings();

    return () => {
      cancelled = true;
    };
  }, [demoSession]);

  useEffect(() => {
    if (!persistenceReady || demoSession.status !== "ready") return;
    const timer = window.setTimeout(() => {
      void demoSession
        .saveState("listings", { propertyRecords })
        .catch((caught) => setLegalAuditError(caught instanceof Error ? caught.message : "Could not save listing state."));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [demoSession, persistenceReady, propertyRecords]);

  const stats = useMemo(() => {
    const total = properties.length;
    const available = properties.filter(
      (p) => p.availability === "available" && getMissing(p).length === 0
    ).length;
    const issues = properties.filter(
      (p) => getMissing(p).length > 0 || isStale(p)
    ).length;
    const underOffer = properties.filter(
      (p) => p.availability === "under_offer"
    ).length;
    return { total, available, issues, underOffer };
  }, [properties]);

  const filtered = useMemo(() => {
    let result = properties;

    if (filter === "available")
      result = result.filter(
        (p) =>
          p.availability === "available" && getMissing(p).length === 0
      );
    else if (filter === "issues")
      result = result.filter(
        (p) => getMissing(p).length > 0 || isStale(p)
      );
    else if (filter === "under_offer")
      result = result.filter((p) => p.availability === "under_offer");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.price.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "price")
        cmp = parseFloat(a.price.replace(/[^0-9.]/g, "")) -
          parseFloat(b.price.replace(/[^0-9.]/g, ""));
      else cmp = a.lastUpdatedHoursAgo - b.lastUpdatedHoursAgo;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [properties, filter, search, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function openUpdateFlow(property: Property) {
    const rawProperty = propertyRecords.find((item) => item.id === property.id) ?? property;
    setUpdateTarget(rawProperty);
    setUpdateInput("");
    setUpdateDraft(null);
    setUpdateError(null);
  }

  function useSampleNote() {
    if (!updateTarget) return;
    const note =
      locale === "tr"
        ? `${updateTarget.title}. Mutfak tamamen yenilenmiş, ankastre set eklenmiş. Fiyatı 1800 Pound'a çıkarıyoruz ve evcil hayvana artık izin veriliyor.`
        : `${updateTarget.title}. The kitchen has been fully renovated with integrated appliances. Increase the price to 1800 pounds and pets are now allowed.`;
    setUpdateInput(note);
  }

  async function generateUpdateDraft() {
    if (!updateTarget || !updateInput.trim()) return;
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const response = await fetch("/api/properties/auto-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: updateTarget.id,
          inputText: updateInput,
          locale,
        }),
      });
      if (!response.ok) {
        throw new Error(locale === "tr" ? "Güncelleme taslağı hazırlanamadı." : "Update draft could not be prepared.");
      }
      setUpdateDraft((await response.json()) as ListingUpdateDraft);
    } catch (caught) {
      setUpdateError(caught instanceof Error ? caught.message : locale === "tr" ? "Bilinmeyen hata" : "Unknown error");
    } finally {
      setUpdateLoading(false);
    }
  }

  async function runLegalAudit() {
    setLegalAuditLoading(true);
    setLegalAuditError(null);
    try {
      const response = await fetch("/api/compliance/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, properties: propertyRecords }),
      });
      if (!response.ok) {
        throw new Error(locale === "tr" ? "Yasal denetim çalıştırılamadı." : "Legal audit could not be completed.");
      }
      const report = (await response.json()) as LegalAuditReport;
      setLegalAudit(report);
      setToast(report.summary);
      window.setTimeout(() => setToast(null), 2600);
    } catch (caught) {
      setLegalAuditError(caught instanceof Error ? caught.message : locale === "tr" ? "Bilinmeyen hata" : "Unknown error");
    } finally {
      setLegalAuditLoading(false);
    }
  }

  function approveUpdateDraft() {
    if (!updateDraft) return;
    setPropertyRecords((current) =>
      current.map((property) => (property.id === updateDraft.propertyId ? applyListingDraft(property, updateDraft, locale) : property))
    );
    setExpandedId(updateDraft.propertyId);
    setToast(locale === "tr" ? "İlan güncellendi. Değişiklikler onayla işlendi." : "Listing updated after approval.");
    window.setTimeout(() => setToast(null), 2600);
    closeUpdateFlow();
  }

  function closeUpdateFlow() {
    setUpdateTarget(null);
    setUpdateInput("");
    setUpdateDraft(null);
    setUpdateError(null);
    setUpdateLoading(false);
  }

  async function resetListingsDemo() {
    setPropertyRecords(demoProperties);
    setExpandedId(null);
    setUpdateTarget(null);
    setUpdateInput("");
    setUpdateDraft(null);
    setLegalAudit(null);
    setLegalAuditError(null);
    try {
      await demoSession.resetState(["listings"]);
      setToast(locale === "tr" ? "Ilan demo state'i sifirlandi." : "Listing demo state reset.");
      window.setTimeout(() => setToast(null), 2600);
    } catch (caught) {
      setLegalAuditError(caught instanceof Error ? caught.message : locale === "tr" ? "Demo sifirlanamadi." : "Demo reset failed.");
    }
  }

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (
      sortDir === "asc" ? (
        <ChevronUp size={13} className="inline" />
      ) : (
        <ChevronDown size={13} className="inline" />
      )
    ) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Panel variant="terminal" className="overflow-hidden">
        <div className="notebook-title-bar">
          <div className="flex items-center gap-2">
            <Home size={16} />
            <span className="font-heading text-sm font-bold uppercase tracking-wide">
              {locale === "tr" ? "İlan Envanteri" : "Listing Inventory"}
            </span>
          </div>
          <Badge tone="neutral">
            {stats.total}{" "}
            {locale === "tr" ? "ilan" : "listings"}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => void resetListingsDemo()} className="min-h-8 px-2.5">
            {locale === "tr" ? "Reset" : "Reset"}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
          <StatButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
            count={stats.total}
            label={locale === "tr" ? "Tümü" : "All"}
          />
          <StatButton
            active={filter === "available"}
            onClick={() => setFilter("available")}
            count={stats.available}
            label={locale === "tr" ? "Hazır" : "Ready"}
            tone="success"
          />
          <StatButton
            active={filter === "issues"}
            onClick={() => setFilter("issues")}
            count={stats.issues}
            label={locale === "tr" ? "Dikkat gerekli" : "Needs attention"}
            tone="risk"
          />
          <StatButton
            active={filter === "under_offer"}
            onClick={() => setFilter("under_offer")}
            count={stats.underOffer}
            label={locale === "tr" ? "Teklif sürecinde" : "Under offer"}
            tone="warm"
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Search size={15} className="shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              locale === "tr"
                ? "İlan ara (başlık, lokasyon, fiyat)..."
                : "Search listings (title, location, price)..."
            }
            className="w-full bg-transparent font-body text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <SlidersHorizontal
            size={15}
            className="shrink-0 text-muted-foreground"
          />
        </div>

        {/* Table header */}
        <div className="hidden border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[minmax(0,2.5fr)_100px_120px_100px_80px_90px_100px]  md:gap-3">
          <button
            type="button"
            onClick={() => toggleSort("title")}
            className="flex items-center gap-1 text-left hover:text-foreground"
          >
            {locale === "tr" ? "İlan" : "Property"} <SortIcon col="title" />
          </button>
          <button
            type="button"
            onClick={() => toggleSort("price")}
            className="flex items-center gap-1 text-left hover:text-foreground"
          >
            {locale === "tr" ? "Fiyat" : "Price"} <SortIcon col="price" />
          </button>
          <span>{locale === "tr" ? "Durum" : "Status"}</span>
          <span>EPC</span>
          <span>{locale === "tr" ? "Otopark" : "Parking"}</span>
          <button
            type="button"
            onClick={() => toggleSort("updated")}
            className="flex items-center gap-1 text-left hover:text-foreground"
          >
            {locale === "tr" ? "Güncell." : "Updated"}{" "}
            <SortIcon col="updated" />
          </button>
          <span>{locale === "tr" ? "Sağlık" : "Health"}</span>
        </div>

        {/* Table body */}
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center font-body text-sm text-muted-foreground">
              {locale === "tr"
                ? "Bu filtreyle eşleşen ilan yok."
                : "No listings match this filter."}
            </div>
          ) : (
            filtered.map((property) => (
              <PropertyRow
                key={property.id}
                property={property}
                locale={locale}
                dictionary={dictionary}
                expanded={expandedId === property.id}
                onStartUpdate={() => openUpdateFlow(property)}
                onToggle={() =>
                  setExpandedId(
                    expandedId === property.id ? null : property.id
                  )
                }
              />
            ))
          )}
        </div>
      </Panel>

      <Panel variant="terminal" className="overflow-hidden">
        <div className="notebook-title-bar">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck size={16} />
            <span className="font-heading text-sm font-bold uppercase tracking-wide">
              {locale === "tr" ? "Haftalık Yasal Denetçi" : "Weekly Legal Guardian"}
            </span>
          </div>
          <Button size="sm" onClick={runLegalAudit} disabled={legalAuditLoading} className="min-h-9 px-3">
            {legalAuditLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            {locale === "tr" ? "Denetimi Çalıştır" : "Run audit"}
          </Button>
        </div>

        <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="font-body text-sm leading-6 text-muted-foreground">
              {locale === "tr"
                ? "Bu denetçi haftada bir otomatik çalışacak şekilde ayarlandı. Aynı kontrolü buradan manuel de başlatabilirsiniz."
                : "This guardian is configured for a weekly automated run. You can also trigger the same check manually here."}
            </p>
            <div className="grid grid-cols-4 gap-2">
              <AuditStat label={locale === "tr" ? "Toplam" : "Total"} value={legalAudit?.totals.checked ?? properties.length} />
              <AuditStat label="PASS" value={legalAudit?.totals.pass ?? 0} tone="success" />
              <AuditStat label="WARN" value={legalAudit?.totals.warn ?? 0} tone="warm" />
              <AuditStat label="FAIL" value={legalAudit?.totals.fail ?? 0} tone="risk" />
            </div>
            {legalAuditError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 font-body text-sm text-amber-900">{legalAuditError}</div>
            ) : null}
          </div>

          {legalAudit ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-body text-sm leading-6 text-foreground">{legalAudit.summary}</p>
                <Badge tone={legalAudit.status === "PASS" ? "success" : legalAudit.status === "WARN" ? "warm" : "risk"}>
                  {legalAudit.status}
                </Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {legalAudit.decisions
                  .filter((decision) => decision.status !== "PASS")
                  .slice(0, 6)
                  .map((decision) => (
                    <LegalDecisionCard key={decision.propertyId} decision={decision} locale={locale} />
                  ))}
              </div>
              {legalAudit.decisions.every((decision) => decision.status === "PASS") ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3 font-body text-sm text-muted-foreground">
                  {locale === "tr" ? "Yayına engel kritik eksik görünmüyor." : "No blocking legal gaps are visible."}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-32 items-center rounded-lg border border-dashed border-border bg-muted/20 p-4 font-body text-sm leading-6 text-muted-foreground">
              {locale === "tr"
                ? "Denetim çalışınca eksik material information alanları, eski müsaitlik bilgileri ve yayına engel riskler burada listelenir."
                : "After the audit runs, missing material information, stale availability and blocking publish risks will appear here."}
            </div>
          )}
        </div>
      </Panel>

      <p className="px-1 font-body text-xs leading-5 text-muted-foreground">
        {locale === "tr"
          ? "Yapay zeka iş akışının kullandığı demo ilan kayıtları. Eksik alanlar ve güncelliği riskli bilgiler tahmin edilmez; operasyonel risk olarak gösterilir."
          : "Demo listing records used by the AI workflow. Missing fields and stale data are treated as operational risks, not facts to be guessed."}
      </p>

      {updateTarget ? (
        <ListingUpdateModal
          locale={locale}
          property={getLocalizedProperty(updateTarget, locale)}
          input={updateInput}
          draft={updateDraft}
          loading={updateLoading}
          error={updateError}
          onInputChange={setUpdateInput}
          onUseSample={useSampleNote}
          onGenerate={generateUpdateDraft}
          onApprove={approveUpdateDraft}
          onClose={closeUpdateFlow}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border-2 border-border bg-card p-3 font-body text-sm shadow-card">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

/* ── Stat filter button ────────────────────────────────────────── */
function StatButton({
  active,
  onClick,
  count,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  tone?: "success" | "risk" | "warm";
}) {
  const toneColors = {
    success: "text-emerald-600",
    risk: "text-amber-600",
    warm: "text-orange-500",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 bg-card px-3 py-2.5 transition-colors hover:bg-muted/60 ${
        active
          ? "ring-inset ring-2 ring-primary/30 bg-primary/5"
          : ""
      }`}
    >
      <span
        className={`font-heading text-xl font-bold ${
          tone ? toneColors[tone] : "text-foreground"
        }`}
      >
        {count}
      </span>
      <span className="font-body text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

function AuditStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warm" | "risk";
}) {
  const toneColors = {
    neutral: "text-foreground",
    success: "text-emerald-600",
    warm: "text-orange-500",
    risk: "text-amber-700",
  };
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-2">
      <div className={`font-heading text-lg font-bold ${toneColors[tone]}`}>{value}</div>
      <div className="font-body text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function LegalDecisionCard({ decision, locale }: { decision: LegalGuardDecision; locale: Locale }) {
  const tone = decision.status === "FAIL" ? "risk" : decision.status === "WARN" ? "warm" : "success";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-heading text-sm font-semibold">{decision.propertyTitle}</div>
          <p className="mt-1 font-body text-xs leading-5 text-muted-foreground">{decision.summary}</p>
        </div>
        <Badge tone={tone} className="shrink-0">
          {decision.status}
        </Badge>
      </div>
      <div className="space-y-2">
        {decision.issues.slice(0, 3).map((issue) => (
          <div key={`${decision.propertyId}-${issue.field}-${issue.requiredAction}`} className="border-l-2 border-amber-500 pl-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-heading text-xs">{issue.field}</span>
              <Badge tone={issue.severity === "high" ? "risk" : "warm"} className="min-h-5 px-2 py-0 text-[10px]">
                {issue.severity}
              </Badge>
            </div>
            <p className="mt-0.5 font-body text-xs leading-5 text-muted-foreground">{issue.requiredAction}</p>
          </div>
        ))}
      </div>
      {decision.issues.length > 3 ? (
        <p className="mt-2 font-body text-xs text-muted-foreground">
          {locale === "tr" ? `+${decision.issues.length - 3} ek kontrol` : `+${decision.issues.length - 3} more checks`}
        </p>
      ) : null}
    </div>
  );
}

/* ── Table row ─────────────────────────────────────────────────── */
function PropertyRow({
  property,
  locale,
  dictionary,
  expanded,
  onStartUpdate,
  onToggle,
}: {
  property: Property;
  locale: Locale;
  dictionary: ReturnType<typeof getDictionary>;
  expanded: boolean;
  onStartUpdate: () => void;
  onToggle: () => void;
}) {
  const missing = getMissing(property);
  const stale = isStale(property);
  const complete = missing.length === 0 && !stale;
  const isUnderOffer = property.availability === "under_offer";

  const healthTone: "success" | "risk" | "warm" = complete
    ? "success"
    : isUnderOffer
      ? "warm"
      : "risk";
  const healthLabel = complete
    ? locale === "tr"
      ? "Tam"
      : "OK"
    : isUnderOffer
      ? locale === "tr"
        ? "Teklif"
        : "Offer"
      : `${missing.length + (stale ? 1 : 0)} ${
          locale === "tr" ? "uyarı" : "alert" + (missing.length + (stale ? 1 : 0) > 1 ? "s" : "")
        }`;

  return (
    <div>
      {/* Main row */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/40 ${
          expanded ? "bg-muted/30" : "bg-card"
        }`}
      >
        {/* Desktop */}
        <div className="hidden items-center md:grid md:grid-cols-[48px_minmax(0,2.5fr)_100px_120px_100px_80px_90px_100px] md:gap-3">
          {/* Image Thumbnail */}
          <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-muted">
            {property.imageUrl ? (
              <img
                src={property.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <Home size={16} />
              </div>
            )}
          </div>

          {/* Title + location */}
          <div className="min-w-0">
            <div className="truncate font-heading text-sm font-semibold leading-5 text-foreground">
              {property.title}
            </div>
            <div className="truncate font-body text-xs text-muted-foreground">
              {property.location} · {formatPropertyType(property.type, locale)} · {property.bedrooms}
              {locale === "tr" ? " oda" : " bed"}
            </div>
          </div>

          {/* Price */}
          <span className="font-body text-sm font-semibold text-foreground">
            {property.price}
          </span>

          {/* Availability */}
          <Badge
            tone={
              property.availability === "available"
                ? "success"
                : property.availability === "under_offer" || property.availability === "let_agreed"
                  ? "warm"
                  : "risk"
            }
            className="w-fit text-[11px]"
          >
            {formatAvailability(property.availability, locale)}
          </Badge>

          {/* EPC */}
          <span
            className={`font-body text-sm ${
              property.epc
                ? "text-foreground"
                : "font-semibold text-amber-600"
            }`}
          >
            {property.epc ?? (locale === "tr" ? "Eksik" : "Missing")}
          </span>

          {/* Parking */}
          <span
            className={`truncate font-body text-xs ${
              property.parking
                ? "text-muted-foreground"
                : "font-semibold text-amber-600"
            }`}
          >
            {property.parking
              ? "✓"
              : locale === "tr"
                ? "Eksik"
                : "Missing"}
          </span>

          {/* Last updated */}
          <span
            className={`flex items-center gap-1 font-body text-xs ${
              stale
                ? "font-semibold text-amber-600"
                : "text-muted-foreground"
            }`}
          >
            {stale ? <Clock3 size={12} /> : null}
            {property.lastUpdatedHoursAgo}
            {locale === "tr" ? " sa" : "h"}
          </span>

          {/* Health */}
          <Badge tone={healthTone} className="w-fit text-[11px]">
            {complete ? (
              <CheckCircle2 size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            {healthLabel}
          </Badge>
        </div>

        {/* Mobile */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {property.imageUrl ? (
                <img
                  src={property.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                  <Home size={16} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-heading text-sm font-semibold">
                {property.title}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{property.price}</span>
                <span>·</span>
                <span>{property.location}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={healthTone} className="text-[11px]">
              {complete ? (
                <CheckCircle2 size={12} />
              ) : (
                <AlertTriangle size={12} />
              )}
              {healthLabel}
            </Badge>
            {expanded ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded ? (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          {/* Description Block */}
          {property.description ? (
            <div className="mb-4">
              <div className="mb-1 font-body text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {locale === "tr" ? "İlan Açıklaması" : "Listing Description"}
              </div>
              <p className="font-body text-sm leading-6 text-foreground max-w-3xl">
                {property.description}
              </p>
            </div>
          ) : null}

          <dl className="mt-1 max-w-2xl space-y-1.5">
            <DetailCell
              label={locale === "tr" ? "Fiyat" : "Price"}
              value={property.price}
            />
            <DetailCell
              label={dictionary.availability}
              value={formatAvailability(property.availability, locale)}
            />
            <DetailCell
              label={dictionary.epc}
              value={property.epc ?? dictionary.missing}
              warn={!property.epc}
            />
            <DetailCell
              label={locale === "tr" ? "Belediye vergisi" : "Council tax"}
              value={property.councilTax ?? dictionary.missing}
              warn={!property.councilTax}
            />
            <DetailCell
              label={dictionary.parking}
              value={property.parking ?? dictionary.missing}
              warn={!property.parking}
            />
            <DetailCell
              label={locale === "tr" ? "Evcil hayvan" : "Pets"}
              value={
                property.petsAllowed
                  ? locale === "tr"
                    ? "İzin var"
                    : "Allowed"
                  : locale === "tr"
                    ? "İzin yok"
                    : "Not allowed"
              }
            />
            <DetailCell
              label={locale === "tr" ? "Son güncelleme" : "Last updated"}
              value={`${property.lastUpdatedHoursAgo} ${
                locale === "tr" ? "saat önce" : "hours ago"
              }`}
              warn={stale}
            />
            {property.tenure ? (
              <DetailCell
                label={locale === "tr" ? "Mülkiyet" : "Tenure"}
                value={property.tenure}
              />
            ) : null}
            {property.serviceCharge ? (
              <DetailCell
                label={locale === "tr" ? "Hizmet bedeli" : "Service charge"}
                value={property.serviceCharge}
              />
            ) : null}
            {property.groundRent ? (
              <DetailCell
                label={locale === "tr" ? "Arsa kirası" : "Ground rent"}
                value={property.groundRent}
              />
            ) : null}
            {property.features?.map((feature, index) => (
              <DetailCell
                key={feature}
                label={
                  index === 0
                    ? locale === "tr"
                      ? "Özellikler"
                      : "Features"
                    : ""
                }
                value={feature}
              />
            ))}
          </dl>

          {missing.length > 0 ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-body text-xs font-medium text-amber-900">
              <AlertTriangle size={12} />
              {locale === "tr" ? "Eksik" : "Missing"}:{" "}
              {missing
                .map((field) => formatMissingField(field, locale))
                .join(", ")}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={onStartUpdate}>
              <Sparkles size={14} />
              {locale === "tr" ? "AI ile güncelle" : "AI update"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Detail cell ───────────────────────────────────────────────── */
function ListingUpdateModal({
  locale,
  property,
  input,
  draft,
  loading,
  error,
  onInputChange,
  onUseSample,
  onGenerate,
  onApprove,
  onClose,
}: {
  locale: Locale;
  property: Property;
  input: string;
  draft: ListingUpdateDraft | null;
  loading: boolean;
  error: string | null;
  onInputChange: (value: string) => void;
  onUseSample: () => void;
  onGenerate: () => void;
  onApprove: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border-2 border-ink bg-card shadow-card">
        <div className="notebook-title-bar sticky top-0 z-10 gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Bot size={17} className="shrink-0" />
            <div className="min-w-0">
              <div className="truncate font-heading text-sm font-bold uppercase tracking-wide">
                {locale === "tr" ? "Çoklu modlu ilan güncelleme" : "Multi-modal listing update"}
              </div>
              <div className="truncate font-body text-xs text-muted-foreground">{property.title}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={locale === "tr" ? "Kapat" : "Close"} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <section className="space-y-3">
            <div>
              <label className="eyebrow mb-2 block">
                {locale === "tr" ? "Saha notu / e-posta / ses transkripti" : "Field note / email / voice transcript"}
              </label>
              <textarea
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                rows={9}
                className="w-full resize-none rounded-lg border-2 border-border bg-input p-3 font-body text-sm leading-6 outline-none focus:border-primary"
                placeholder={locale === "tr" ? "Örn: Mutfak yenilendi, fiyat 1800 Pound, evcil hayvana izin var..." : "Example: Kitchen renovated, price 1800 pounds, pets are allowed..."}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onUseSample} className="min-h-9 px-3">
                <Mic size={14} />
                {locale === "tr" ? "Örnek ses notu" : "Sample voice note"}
              </Button>
              <Button size="sm" onClick={onGenerate} disabled={loading || !input.trim()} className="min-h-9 px-3">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {locale === "tr" ? "Taslak çıkar" : "Create draft"}
              </Button>
            </div>

            {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 font-body text-sm text-amber-900">{error}</div> : null}

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="eyebrow mb-2">{locale === "tr" ? "Mevcut kayıt" : "Current record"}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <MiniField label={locale === "tr" ? "Fiyat" : "Price"} value={property.price} />
                <MiniField label={locale === "tr" ? "Durum" : "Availability"} value={formatAvailability(property.availability, locale)} />
                <MiniField label={locale === "tr" ? "Otopark" : "Parking"} value={property.parking ?? (locale === "tr" ? "Eksik" : "Missing")} />
                <MiniField label={locale === "tr" ? "Evcil hayvan" : "Pets"} value={property.petsAllowed ? (locale === "tr" ? "İzin var" : "Allowed") : locale === "tr" ? "İzin yok" : "Not allowed"} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="rounded-lg border-2 border-border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="eyebrow">{locale === "tr" ? "Değişiklik onayı" : "Review changes"}</div>
                {draft ? <Badge tone={draft.confidence > 0.78 ? "success" : "warm"}>{Math.round(draft.confidence * 100)}%</Badge> : null}
              </div>

              {!draft ? (
                <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border bg-card p-4 text-center font-body text-sm leading-6 text-muted-foreground">
                  {locale === "tr" ? "Notu girip taslak çıkardığında önerilen alanlar burada görünecek." : "Suggested fields will appear here after the draft is created."}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-body text-sm leading-6 text-foreground">{draft.summary}</p>
                  <div className="space-y-2">
                    {draft.changes.length ? (
                      draft.changes.map((change) => <ChangeRow key={`${change.field}-${change.newValue}`} change={change} />)
                    ) : (
                      <p className="rounded-lg border border-border bg-card p-3 font-body text-sm text-muted-foreground">
                        {locale === "tr" ? "Net alan değişikliği bulunamadı." : "No clear field change was found."}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="eyebrow mb-1">{locale === "tr" ? "Yeni ilan açıklaması" : "New listing description"}</div>
                    <p className="rounded-lg border border-border bg-card p-3 font-body text-sm leading-6 text-foreground">{draft.proposedDescription}</p>
                  </div>

                  {draft.riskFlags.length ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="mb-1 flex items-center gap-1.5 font-heading text-sm text-amber-900">
                        <AlertTriangle size={14} />
                        {locale === "tr" ? "Kontrol gerekli" : "Review needed"}
                      </div>
                      <ul className="space-y-1">
                        {draft.riskFlags.map((flag) => (
                          <li key={flag} className="font-body text-sm leading-5 text-amber-900">- {flag}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={onClose} className="min-h-9 px-3">
                {locale === "tr" ? "İptal" : "Cancel"}
              </Button>
              <Button size="sm" onClick={onApprove} disabled={!draft || !draft.changes.length} className="min-h-9 px-3">
                <CheckCircle2 size={14} />
                {locale === "tr" ? "Onayla ve güncelle" : "Approve and update"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ChangeRow({ change }: { change: ListingUpdateDraft["changes"][number] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-heading text-sm">{change.label}</span>
        <Badge tone="neutral">{Math.round(change.confidence * 100)}%</Badge>
      </div>
      <div className="grid gap-2 font-body text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <span className="rounded-md bg-muted/50 px-2 py-1 text-muted-foreground">{change.oldValue}</span>
        <span className="hidden text-center text-muted-foreground sm:block">→</span>
        <span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-foreground">{change.newValue}</span>
      </div>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-card px-2.5 py-2">
      <div className="font-body text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-body text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function applyListingDraft(property: Property, draft: ListingUpdateDraft, locale: Locale): Property {
  const extracted = draft.extracted;
  const features = Array.from(new Set([...(property.features ?? []), ...(extracted.features ?? [])]));
  return {
    ...property,
    price: extracted.price ?? property.price,
    petsAllowed: typeof extracted.petsAllowed === "boolean" ? extracted.petsAllowed : property.petsAllowed,
    parking: extracted.parking ?? property.parking,
    parkingTr: extracted.parking && locale === "tr" ? extracted.parking : property.parkingTr,
    epc: extracted.epc ?? property.epc,
    councilTax: extracted.councilTax ?? property.councilTax,
    availability: extracted.availability ?? property.availability,
    features,
    featuresTr: locale === "tr" && extracted.features?.length ? features : property.featuresTr,
    description: locale === "en" ? draft.proposedDescription : property.description,
    descriptionTr: locale === "tr" ? draft.proposedDescription : property.descriptionTr,
    lastUpdatedHoursAgo: 0,
  };
}

function DetailCell({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 py-0.5">
      <dt className="w-36 shrink-0 font-body text-xs text-muted-foreground">
        {label || "\u00a0"}
      </dt>
      <dd
        className={`min-w-0 flex-1 font-body text-sm ${
          warn
            ? "font-semibold text-amber-600"
            : "font-medium text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
