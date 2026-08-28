"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  FileText,
  FilePenLine,
  Gauge,
  History,
  Home,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { getLocalizedMessages, getLocalizedProfiles, getLocalizedProperties } from "@/src/data/demo-data";
import { getDictionary } from "@/src/i18n/get-dictionary";
import {
  formatAvailability,
  formatChannel,
  formatCustomerType,
  formatGeneratedActionText,
  formatIntent,
  formatMissingField,
  formatRiskFlag,
  formatSource,
  formatStatus,
  formatTemperature,
} from "@/src/i18n/labels";
import { sanitizeBriefingForDisplay, sanitizeUserFacingList } from "@/src/i18n/sanitize-display";
import { useDemoSession } from "@/src/hooks/use-demo-session";
import type {
  ActionCard,
  ActivityEvent,
  ActivityEventType,
  AgentSuggestion,
  Briefing,
  ChatMessage,
  ConversationContextSource,
  ConversationAiInsight,
  CustomerMessage,
  InboxAnalysisMessage,
  InboxPrioritizationItem,
  Locale,
} from "@/src/types";
import { sortByInboxPriority, sortByReceivedAt, type InboxSortOrder } from "@/src/utils/inbox-sort";
import { Badge, Button, Panel } from "./ui";

type ActionState = {
  approved: boolean;
  followUpCreated: boolean;
  listingMarked: boolean;
  crmSaved: boolean;
  edited: boolean;
};

type WorkflowPersistedState = {
  selectedId: string;
  actionState: ActionState;
  activityLog: ActivityEvent[];
  chatMessages: Record<string, ChatMessage[]>;
  conversationContext: Record<string, ConversationContextSource[]>;
  draft: string;
  inboxInsights: Record<string, ConversationAiInsight>;
};

const defaultActionState: ActionState = {
  approved: false,
  followUpCreated: false,
  listingMarked: false,
  crmSaved: false,
  edited: false,
};

const acceptedContextFileExtensions = [".txt", ".md", ".csv", ".json", ".log", ".rtf", ".html", ".xml", ".yaml", ".yml"];
const acceptedContextMimeTypes = [
  "text/",
  "application/json",
  "application/xml",
  "application/rtf",
  "application/yaml",
  "application/x-yaml",
];

const progressCopy = {
  card: {
    en: ["Checking customer history...", "Reviewing listing context...", "Preparing next-best-action card..."],
    tr: ["Müşteri geçmişi kontrol ediliyor...", "İlan bağlamı inceleniyor...", "Sıradaki en iyi aksiyon hazırlanıyor..."],
  },
  chat: {
    en: ["Reviewing conversation memory...", "Checking recent actions...", "Preparing customer-style reply..."],
    tr: ["Görüşme hafızası inceleniyor...", "Son aksiyonlar kontrol ediliyor...", "Müşteri profiline uygun cevap hazırlanıyor..."],
  },
  briefing: {
    en: ["Reading activity log...", "Summarising completed work...", "Finding open risks..."],
    tr: ["Aktivite kayıtları okunuyor...", "Tamamlanan işler özetleniyor...", "Açık riskler bulunuyor..."],
  },
  inbox: {
    en: ["Finding new message turns...", "Updating saved lead scores...", "Sorting inbox by conversion likelihood..."],
    tr: ["Yeni mesajlar bulunuyor...", "Kayıtlı müşteri skorları güncelleniyor...", "Gelen kutusu dönüşüm ihtimaline göre sıralanıyor..."],
  },
};

export function DemoDashboard({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const demoSession = useDemoSession();
  const messages = useMemo(() => getLocalizedMessages(locale), [locale]);
  const profiles = useMemo(() => getLocalizedProfiles(locale), [locale]);
  const properties = useMemo(() => getLocalizedProperties(locale), [locale]);
  const [selectedId, setSelectedId] = useState(messages[0].id);
  const [actionCard, setActionCard] = useState<ActionCard | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState<"card" | "briefing" | "chat" | "inbox" | null>(null);
  const [progressStep, setProgressStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>(defaultActionState);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [conversationContext, setConversationContext] = useState<Record<string, ConversationContextSource[]>>({});
  const [contextDraft, setContextDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [inboxSort, setInboxSort] = useState<InboxSortOrder>("newest");
  const [inboxInsights, setInboxInsights] = useState<Record<string, ConversationAiInsight>>({});
  const [persistenceReady, setPersistenceReady] = useState(!demoSession.configured);

  useEffect(() => {
    if (!demoSession.configured) {
      setPersistenceReady(true);
      return;
    }
    if (demoSession.status !== "ready") return;

    let cancelled = false;

    async function loadPersistedWorkflow() {
      try {
        const persisted = await demoSession.loadState<WorkflowPersistedState>("workflow");
        if (cancelled) return;
        if (persisted) {
          setSelectedId(messages.some((message) => message.id === persisted.selectedId) ? persisted.selectedId : messages[0].id);
          setActionState(persisted.actionState ?? defaultActionState);
          setActivityLog(Array.isArray(persisted.activityLog) ? persisted.activityLog : []);
          setChatMessages(persisted.chatMessages ?? {});
          setConversationContext(persisted.conversationContext ?? {});
          setDraft(persisted.draft ?? "");
          setInboxInsights(persisted.inboxInsights ?? {});
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load demo state.");
      } finally {
        if (!cancelled) setPersistenceReady(true);
      }
    }

    void loadPersistedWorkflow();

    return () => {
      cancelled = true;
    };
  }, [demoSession, messages]);

  useEffect(() => {
    if (!persistenceReady || demoSession.status !== "ready") return;

    const timer = window.setTimeout(() => {
      void demoSession
        .saveState("workflow", {
          selectedId,
          actionState,
          activityLog,
          chatMessages,
          conversationContext,
          draft,
          inboxInsights,
        } satisfies WorkflowPersistedState)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not save demo state."));
    }, 450);

    return () => window.clearTimeout(timer);
  }, [actionState, activityLog, chatMessages, conversationContext, demoSession, draft, inboxInsights, persistenceReady, selectedId]);

  const sortedMessages = useMemo(
    () => (inboxSort === "aiPriority" ? sortByInboxPriority(messages, inboxInsights) : sortByReceivedAt(messages, inboxSort)),
    [inboxInsights, inboxSort, messages],
  );
  const pendingAiReviewCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          getMessagesAfterLastAnalysis(
            message,
            chatMessages[message.id] ?? [],
            inboxInsights[message.id],
            conversationContext[message.id] ?? [],
          ).length > 0,
      )
        .length,
    [chatMessages, conversationContext, inboxInsights, messages],
  );

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedId) ?? messages[0],
    [messages, selectedId],
  );
  const selectedProfile = profiles.find((profile) => profile.messageId === selectedId) ?? profiles[0];
  const relatedProperty = properties.find((property) => property.id === selectedMessage.propertyReferenceId);
  const selectedChat = useMemo(() => chatMessages[selectedId] ?? [], [chatMessages, selectedId]);
  const selectedContext = useMemo(() => conversationContext[selectedId] ?? [], [conversationContext, selectedId]);
  const initialEnquiry = useMemo(
    (): ChatMessage => ({
      id: `enquiry_${selectedMessage.id}`,
      messageId: selectedMessage.id,
      role: "customer",
      text: selectedMessage.message,
      createdAt: selectedMessage.receivedAt,
    }),
    [selectedMessage],
  );
  const displayChat = useMemo(() => [initialEnquiry, ...selectedChat], [initialEnquiry, selectedChat]);
  const selectedEvents = activityLog.filter((event) => event.messageId === selectedId);
  const suggestions = useMemo(
    () => buildSuggestions(selectedMessage, selectedProfile.name, actionCard, actionState, selectedEvents, locale),
    [selectedMessage, selectedProfile.name, actionCard, actionState, selectedEvents, locale],
  );

  function pushEvent(type: ActivityEventType, title: string, detail: string, messageId = selectedId) {
    const message = messages.find((item) => item.id === messageId) ?? selectedMessage;
    const event: ActivityEvent = {
      id: `${type}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type,
      messageId,
      customerName: message.leadName,
      title,
      detail,
      createdAt: new Date().toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    setActivityLog((current) => [event, ...current].slice(0, 80));
    setToast(detail);
    window.setTimeout(() => setToast(null), 2600);
    return event;
  }

  function setProgress(kind: keyof typeof progressCopy) {
    const steps = progressCopy[kind][locale];
    setProgressStep(steps[0]);
    steps.slice(1).forEach((step, index) => {
      window.setTimeout(() => setProgressStep(step), (index + 1) * 850);
    });
  }

  function selectMessage(message: CustomerMessage) {
    setSelectedId(message.id);
    setActionCard(null);
    setActionState(defaultActionState);
    setError(null);
    setContextDraft("");
    pushEvent(
      "message_selected",
      locale === "tr" ? "Müşteri seçildi" : "Customer selected",
      locale === "tr" ? `${message.leadName} dosyası açıldı.` : `${message.leadName} opened in the console.`,
      message.id,
    );
  }

  function addConversationContext(source: Pick<ConversationContextSource, "source" | "title" | "text">) {
    const text = source.text.trim();
    if (!text) return;
    const createdAt = new Date().toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-GB", { hour: "2-digit", minute: "2-digit" });
    const entry: ConversationContextSource = {
      id: `context_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      messageId: selectedId,
      source: source.source,
      title: source.title.trim() || (locale === "tr" ? "Ek sohbet notu" : "Extra conversation note"),
      text: text.slice(0, 6000),
      createdAt,
    };
    setConversationContext((current) => ({ ...current, [selectedId]: [entry, ...(current[selectedId] ?? [])].slice(0, 8) }));
    setActionCard(null);
    pushEvent(
      "conversation_context_added",
      locale === "tr" ? "Sohbet beslendi" : "Conversation fed",
      locale === "tr"
        ? `${selectedMessage.leadName} için ek sohbet bilgisi AI hafızasına eklendi.`
        : `Extra conversation context was added to ${selectedMessage.leadName}'s AI memory.`,
    );
  }

  function addTextConversationContext() {
    if (!contextDraft.trim()) return;
    addConversationContext({
      source: "pasted_text",
      title: locale === "tr" ? "Kopyalanan konuşma" : "Pasted conversation",
      text: contextDraft,
    });
    setContextDraft("");
  }

  async function handleContextFileUpload(file: File | undefined) {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const hasAcceptedExtension = acceptedContextFileExtensions.some((extension) => fileName.endsWith(extension));
    const hasAcceptedMimeType = acceptedContextMimeTypes.some((type) => file.type.startsWith(type) || file.type === type);
    if (!hasAcceptedExtension && !hasAcceptedMimeType) {
      setError(
        locale === "tr"
          ? "Sadece metin bazlı dosyalar yüklenebilir: TXT, MD, CSV, JSON, LOG, RTF, HTML, XML, YAML."
          : "Only text-based files can be uploaded: TXT, MD, CSV, JSON, LOG, RTF, HTML, XML, YAML.",
      );
      return;
    }
    try {
      const text = await file.text();
      addConversationContext({
        source: "uploaded_file",
        title: file.name,
        text,
      });
    } catch {
      setError(locale === "tr" ? "Dosya okunamadı. Metni kopyalayıp alana yapıştırabilirsiniz." : "File could not be read. You can paste the text instead.");
    }
  }

  function removeConversationContext(contextId: string) {
    setConversationContext((current) => ({
      ...current,
      [selectedId]: (current[selectedId] ?? []).filter((item) => item.id !== contextId),
    }));
    setActionCard(null);
  }

  async function generateCard(message: CustomerMessage) {
    setLoading("card");
    setProgress("card");
    setError(null);
    setActionState(defaultActionState);
    try {
      const response = await fetch("/api/analyze-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, locale, activityLog, supplementalContext: conversationContext[message.id] ?? [] }),
      });
      if (!response.ok) throw new Error(locale === "tr" ? "AI analizi başarısız oldu" : "AI analysis failed");
      const card = (await response.json()) as ActionCard;
      setActionCard(card);
      pushEvent(
        "action_card_generated",
        locale === "tr" ? "Aksiyon kartı oluştu" : "Action card generated",
        locale === "tr"
          ? `${message.leadName} için niyet, risk ve takip önerisi çıkarıldı.`
          : `Intent, risk and follow-up recommendation produced for ${message.leadName}.`,
        message.id,
      );
      if (!draft) setDraft(formatGeneratedActionText(card.suggestedReply, locale));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : locale === "tr" ? "Bilinmeyen hata" : "Unknown error");
    } finally {
      setLoading(null);
      setProgressStep("");
    }
  }

  async function sendAgentMessage(text = draft.trim(), markAsOffer = false) {
    if (!text || loading) return;
    const legalDecision = actionCard?.legalGuardDecision;
    if (legalDecision?.status === "FAIL" && !actionState.listingMarked) {
      const detail =
        locale === "tr"
          ? "Compliance Guardian bu gönderimi durdurdu: eksik veya eski material information önce işaretlenip doğrulanmalı."
          : "Compliance Guardian blocked this send: missing or stale material information must be flagged and verified first.";
      pushEvent("compliance_blocked", locale === "tr" ? "Yasal gate gönderimi durdurdu" : "Legal gate blocked send", detail);
      setError(detail);
      return;
    }
    if (legalDecision) {
      pushEvent(
        "compliance_checked",
        locale === "tr" ? "Yasal preflight tamamlandı" : "Legal preflight completed",
        legalDecision.status === "PASS"
          ? legalDecision.summary
          : locale === "tr"
            ? `${legalDecision.summary} Danışman onayı ve audit kaydıyla devam ediliyor.`
            : `${legalDecision.summary} Continuing with agent review and audit trail.`,
      );
    }
    setLoading("chat");
    setProgress("chat");
    setError(null);
    const outgoing: ChatMessage = {
      id: `agent_${Date.now()}`,
      messageId: selectedId,
      role: "agent",
      text,
      createdAt: new Date().toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((current) => ({ ...current, [selectedId]: [...(current[selectedId] ?? []), outgoing] }));
    const sentEvent = pushEvent(
      markAsOffer ? "offer_sent" : "agent_message_sent",
      markAsOffer
        ? locale === "tr"
          ? "Fiyat / şart teklifi gönderildi"
          : "Price / terms offer sent"
        : locale === "tr"
          ? "Mesaj gönderildi"
          : "Message sent",
      markAsOffer
        ? locale === "tr"
          ? `${selectedProfile.name} için kira, fiyat veya pazarlık teklifi gönderildi; müşteri tepkisi bekleniyor.`
          : `Price or terms offer sent to ${selectedProfile.name}; waiting for customer reaction.`
        : locale === "tr"
          ? `${selectedProfile.name} ile görüşmeye danışman mesajı eklendi.`
          : `Agent message added to ${selectedProfile.name}'s conversation.`,
    );
    setDraft("");

    try {
      const response = await fetch("/api/customer-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedId,
          agentText: text,
          isOffer: markAsOffer,
          locale,
          chatHistory: [initialEnquiry, ...selectedChat, outgoing],
          activityLog: [sentEvent, ...activityLog],
          supplementalContext: selectedContext,
        }),
      });
      if (!response.ok) throw new Error(locale === "tr" ? "Müşteri cevabı alınamadı" : "Customer reply failed");
      const result = (await response.json()) as { reply: string; signal: string; source: string };
      const incoming: ChatMessage = {
        id: `customer_${Date.now()}`,
        messageId: selectedId,
        role: "customer",
        text: result.reply,
        createdAt: new Date().toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-GB", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((current) => ({ ...current, [selectedId]: [...(current[selectedId] ?? []), incoming] }));
      pushEvent(
        "customer_reply_received",
        locale === "tr" ? "Müşteri cevap verdi" : "Customer replied",
        result.signal || result.reply.slice(0, 110),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : locale === "tr" ? "Bilinmeyen hata" : "Unknown error");
    } finally {
      setLoading(null);
      setProgressStep("");
    }
  }

  async function generateBrief(type: "morning" | "eod") {
    setLoading("briefing");
    setProgress("briefing");
    setError(null);
    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, locale, activityLog }),
      });
      if (!response.ok) throw new Error(locale === "tr" ? "Özet oluşturulamadı" : "Briefing generation failed");
      const generated = sanitizeBriefingForDisplay((await response.json()) as Briefing, locale);
      setBriefing(generated);
      setBriefingOpen(true);
      pushEvent(
        "briefing_generated",
        type === "morning" ? dictionary.morningBrief : dictionary.eodBrief,
        generated.summary,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : locale === "tr" ? "Bilinmeyen hata" : "Unknown error");
    } finally {
      setLoading(null);
      setProgressStep("");
    }
  }

  async function prioritizeInbox() {
    const conversations: InboxPrioritizationItem[] = messages
      .map((message) => {
        const previousInsight = inboxInsights[message.id];
        const supplementalContext = conversationContext[message.id] ?? [];
        const newMessages = getMessagesAfterLastAnalysis(message, chatMessages[message.id] ?? [], previousInsight, supplementalContext);
        return {
          conversationId: message.id,
          leadName: message.leadName,
          subject: message.subject,
          status: message.status,
          receivedAt: message.receivedAt,
          propertyReference: message.propertyReference,
          previousInsight,
          newMessages,
          supplementalContext,
        };
      })
      .filter((item) => item.newMessages.length > 0);

    if (!conversations.length) {
      setInboxSort("aiPriority");
      setToast(locale === "tr" ? "Yeni analiz gerektiren mesaj yok. Kayıtlı AI sıralaması kullanılıyor." : "No new messages need analysis. Using the saved AI ranking.");
      window.setTimeout(() => setToast(null), 2600);
      return;
    }

    setLoading("inbox");
    setProgress("inbox");
    setError(null);
    try {
      const response = await fetch("/api/prioritize-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, conversations }),
      });
      if (!response.ok) throw new Error(locale === "tr" ? "Gelen kutusu önceliklendirilemedi" : "Inbox prioritisation failed");
      const result = (await response.json()) as { insights: ConversationAiInsight[]; analyzedCount: number };
      setInboxInsights((current) => {
        const next = { ...current };
        result.insights.forEach((insight) => {
          next[insight.conversationId] = insight;
        });
        return next;
      });
      setInboxSort("aiPriority");
      const detail =
        locale === "tr"
          ? `${result.analyzedCount} konuşma yeni mesajlarla güncellendi; eski analizler tekrar okutulmadı.`
          : `${result.analyzedCount} conversations updated from new messages; saved analyses were not re-read.`;
      setToast(detail);
      window.setTimeout(() => setToast(null), 2600);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : locale === "tr" ? "Bilinmeyen hata" : "Unknown error");
    } finally {
      setLoading(null);
      setProgressStep("");
    }
  }

  function markAction(key: keyof ActionState, type: ActivityEventType, detail: string) {
    setActionState((state) => ({ ...state, [key]: true }));
    pushEvent(type, dictionary.actions[key], detail);
  }

  function approveSuggestedReply() {
    if (!actionCard) return;
    const legalDecision = actionCard.legalGuardDecision;
    if (legalDecision?.status === "FAIL" && !actionState.listingMarked) {
      const detail =
        locale === "tr"
          ? "Compliance Guardian onayı bekletti: önce eksik ilan bilgisini işaretle ve doğrulama aksiyonu oluştur."
          : "Compliance Guardian held approval: flag the missing listing data and create the verification action first.";
      pushEvent("compliance_blocked", locale === "tr" ? "Cevap onayı bekletildi" : "Reply approval held", detail);
      setError(detail);
      return;
    }
    setDraft(formatGeneratedActionText(actionCard.suggestedReply, locale));
    markAction(
      "approved",
      "reply_approved",
      locale === "tr" ? "Cevap yasal preflight sonrası taslak alanına alındı." : "Reply passed legal preflight and was staged in the composer.",
    );
  }

  function handleSuggestionClick(suggestion: AgentSuggestion) {
    if (suggestion.id === "generate-card") {
      void generateCard(selectedMessage);
      return;
    }
    if (!actionCard) return;

    switch (suggestion.id) {
      case "mark-missing":
        markAction("listingMarked", "listing_marked", actionCard.suggestedListingAction);
        return;
      case "follow-up":
        markAction("followUpCreated", "follow_up_created", actionCard.suggestedFollowUp);
        return;
      case "crm-note":
        markAction("crmSaved", "crm_note_saved", actionCard.suggestedCrmNote);
        return;
      case "send-reply":
        setDraft(formatGeneratedActionText(actionCard.suggestedReply, locale));
        return;
    }

    setDraft(suggestion.actionText);
  }

  const completedCount = Object.values(actionState).filter(Boolean).length;

  async function resetWorkflowDemo() {
    setSelectedId(messages[0].id);
    setActionCard(null);
    setBriefing(null);
    setLoading(null);
    setProgressStep("");
    setError(null);
    setActionState(defaultActionState);
    setActivityLog([]);
    setChatMessages({});
    setConversationContext({});
    setContextDraft("");
    setDraft("");
    setBriefingOpen(false);
    setInboxSort("newest");
    setInboxInsights({});
    try {
      await demoSession.resetState(["workflow"]);
      setToast(locale === "tr" ? "Demo akisi sifirlandi." : "Demo workflow reset.");
      window.setTimeout(() => setToast(null), 2600);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : locale === "tr" ? "Demo sifirlanamadi." : "Demo reset failed.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
        <div className="min-w-0 font-body text-xs text-muted-foreground">
          {demoSession.status === "ready"
            ? locale === "tr"
              ? `Anon demo session aktif: ${demoSession.userId?.slice(0, 8)}`
              : `Anonymous demo session active: ${demoSession.userId?.slice(0, 8)}`
            : demoSession.status === "loading"
              ? locale === "tr"
                ? "Anon demo session hazirlaniyor..."
                : "Preparing anonymous demo session..."
              : demoSession.status === "error"
                ? demoSession.error ?? (locale === "tr" ? "Supabase session hatasi" : "Supabase session error")
                : locale === "tr"
                  ? "Local fallback demo state"
                  : "Local fallback demo state"}
        </div>
        <Button size="sm" variant="outline" onClick={() => void resetWorkflowDemo()} className="min-h-8 px-2.5">
          <RefreshCcw size={14} />
          {locale === "tr" ? "Demo reset" : "Reset demo"}
        </Button>
      </div>
      <Panel variant="terminal" className="overflow-hidden">
        <div className="notebook-title-bar flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setBriefingOpen((open) => !open)}
            aria-expanded={briefingOpen}
            aria-label={briefingOpen ? dictionary.collapseBriefing : dictionary.expandBriefing}
            className="flex min-w-0 flex-1 items-center gap-2 text-left transition-opacity hover:opacity-80"
          >
            <span className="shrink-0 font-body text-base text-foreground">{dictionary.dailyBriefing}</span>
            {briefing ? (
              <Badge tone="warm" className="hidden shrink-0 sm:inline-flex">
                {dictionary.briefingReady}
              </Badge>
            ) : null}
            {briefingOpen ? (
              <ChevronUp size={18} strokeWidth={2.5} className="ml-auto shrink-0 sm:ml-0" />
            ) : (
              <ChevronDown size={18} strokeWidth={2.5} className="ml-auto shrink-0 sm:ml-0" />
            )}
          </button>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-1.5 sm:ml-auto sm:w-auto sm:border-l sm:border-border sm:pl-3">
            <Button
              size="sm"
              onClick={() => generateBrief("morning")}
              disabled={loading === "briefing"}
              className="h-9 min-h-9 flex-1 px-2.5 text-sm sm:flex-none"
            >
              {loading === "briefing" ? <Loader2 className="animate-spin" size={14} /> : null}
              <span className="hidden lg:inline">{dictionary.morningBrief}</span>
              <span className="lg:hidden">{locale === "tr" ? "Sabah özeti" : "Morning"}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateBrief("eod")}
              disabled={loading === "briefing"}
              className="h-9 min-h-9 flex-1 px-2.5 text-sm sm:flex-none"
            >
              <span className="hidden lg:inline">{dictionary.eodBrief}</span>
              <span className="lg:hidden">{locale === "tr" ? "Gün sonu" : "EOD"}</span>
            </Button>
          </div>
        </div>

        {!briefingOpen ? (
          <div className="border-t border-border px-4 py-2.5">
            {loading === "briefing" ? (
              <Badge tone="cold">
                <Loader2 className="animate-spin" size={13} /> {progressStep}
              </Badge>
            ) : briefing ? (
              <p className="line-clamp-2 font-body text-sm leading-5 text-muted-foreground">{briefing.summary}</p>
            ) : (
              <p className="font-body text-sm leading-5 text-muted-foreground">{dictionary.dailyBriefingDescription}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 border-t border-border p-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <p className="font-body text-sm leading-5 text-muted-foreground">{dictionary.dailyBriefingDescription}</p>
            <div className="mt-3 grid gap-2">
              <Button size="sm" onClick={() => generateBrief("morning")} disabled={loading === "briefing"}>
                {dictionary.morningBrief}
              </Button>
              <Button size="sm" variant="outline" onClick={() => generateBrief("eod")} disabled={loading === "briefing"}>
                {dictionary.eodBrief}
              </Button>
            </div>
            {loading === "briefing" ? (
              <div className="mt-3">
                <Badge tone="cold"><Loader2 className="animate-spin" size={13} /> {progressStep}</Badge>
              </div>
            ) : null}
          </div>

          {briefing ? (
            <div className="grid gap-3 lg:grid-cols-4">
              <BriefCard title={dictionary.briefingSummary} items={[briefing.summary]} emphasis />
              <BriefCard title={dictionary.priorities} items={briefing.priorities} />
              <BriefCard title={dictionary.risks} items={briefing.risks.length ? briefing.risks : [dictionary.noCriticalRisks]} tone="risk" />
              <BriefCard
                title={dictionary.recommendedActions}
                items={sanitizeUserFacingList(
                  [...briefing.recommendedActions, ...(briefing.operatingInsights ?? []).slice(0, 2)],
                  locale,
                )}
                footer={formatSource(briefing.source, locale)}
              />
            </div>
          ) : (
            <div className="flex min-h-36 items-center border border-border rounded-lg bg-muted/20 p-4 font-body text-base leading-6 text-muted-foreground">
              {dictionary.briefingEmpty}
            </div>
          )}
          </div>
        )}
      </Panel>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(260px,18rem)_minmax(0,1fr)_minmax(380px,26rem)] 2xl:grid-cols-[minmax(280px,20rem)_minmax(0,1fr)_minmax(400px,28rem)]">
        <Panel
          variant="explorer"
          title={dictionary.inbox}
          className="sticky top-[5.5rem] z-20 flex h-[calc(100dvh-6.5rem)] flex-col overflow-hidden border-0 self-start"
        >
          <div className="flex shrink-0 flex-col gap-2 border-b border-border p-3">
            <div className="flex items-center justify-between gap-2">
            <span className="eyebrow">{messages.length} {dictionary.demoLeads}</span>
            <Badge tone="cold">{activityLog.length} log</Badge>
            </div>
            <label className="flex items-center gap-2">
              <ArrowDownUp size={14} className="shrink-0 text-muted-foreground" aria-hidden />
              <span className="sr-only">{dictionary.inboxSortLabel}</span>
              <select
                value={inboxSort}
                onChange={(event) => setInboxSort(event.target.value as InboxSortOrder)}
                className="w-full min-w-0 rounded-md border border-border bg-card px-2 py-1.5 font-body text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={dictionary.inboxSortLabel}
              >
                <option value="newest">{dictionary.inboxSortNewest}</option>
                <option value="oldest">{dictionary.inboxSortOldest}</option>
                <option value="aiPriority">{locale === "tr" ? "AI önceliği" : "AI priority"}</option>
              </select>
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={prioritizeInbox}
              disabled={loading !== null}
              className="h-9 min-h-9 w-full px-3 text-xs"
              title={
                locale === "tr"
                  ? "Sadece yeni mesajları analiz eder ve kayıtlı öncelikleri günceller"
                  : "Analyses only new messages and updates the saved priorities"
              }
            >
              {loading === "inbox" ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              {locale === "tr" ? "AI ile Önceliklendir" : "Prioritise with AI"}
              {pendingAiReviewCount ? <Badge tone="accent" className="ml-auto min-h-6 px-2 py-0 text-[11px]">{pendingAiReviewCount}</Badge> : null}
            </Button>
            {loading === "inbox" ? (
              <div className="font-body text-xs leading-5 text-muted-foreground">{progressStep}</div>
            ) : (
              <div className="font-body text-xs leading-5 text-muted-foreground">
                {locale === "tr"
                  ? pendingAiReviewCount
                    ? `${pendingAiReviewCount} konuşmada yeni mesaj var.`
                    : "AI sıralaması güncel."
                  : pendingAiReviewCount
                    ? `${pendingAiReviewCount} conversations have new messages.`
                    : "AI ranking is up to date."}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4">
            {sortedMessages.map((message, index) => (
              (() => {
                const aiInsight = inboxInsights[message.id];
                const priority = aiInsight ? getAiInboxPriority(aiInsight, locale) : getInboxPriority(message, locale);
                const followUpRisk = getFollowUpRisk(message, index, locale);
                return (
              <button
                key={message.id}
                onClick={() => selectMessage(message)}
                className={`w-full border-b border-foreground/10 p-3 text-left transition-colors hover:bg-muted/40 ${
                  message.id === selectedId ? "bg-muted/80 shadow-[inset_3px_0_0_hsl(var(--primary))]" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mono-detail text-xs">
                      0{index + 1} / {message.receivedAt} / {formatChannel(message.channel, locale)}
                    </div>
                    <div className="mt-1 truncate font-heading text-lg leading-6">{message.leadName}</div>
                    <div className="mt-1 line-clamp-2 font-body text-sm leading-5 text-muted-foreground">{message.subject}</div>
                  </div>
                  <Badge tone={priority.tone}>{priority.label}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <span>{formatStatus(message.status, locale)}</span>
                  <span>/</span>
                  <span>{(chatMessages[message.id] ?? []).length} chat</span>
                  <span>/</span>
                  <span>{priority.reason}</span>
                  {aiInsight ? (
                    <>
                      <span>/</span>
                      <span>AI {aiInsight.score}</span>
                    </>
                  ) : null}
                </div>
                {followUpRisk ? (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-body text-xs text-amber-900">
                    <Clock3 size={12} /> {followUpRisk}
                  </div>
                ) : null}
              </button>
                );
              })()
            ))}
          </div>
        </Panel>

        <main className="grid min-h-[calc(100vh-320px)] gap-4 lg:grid-rows-[auto_minmax(320px,1fr)]">
          <Panel className="border-0 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={selectedProfile.urgency === "high" ? "hot" : selectedProfile.urgency === "medium" ? "warm" : "cold"}>
                <UserRound size={13} /> {selectedProfile.archetype}
              </Badge>
              <Badge>{selectedProfile.decisionStyle}</Badge>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Info label={dictionary.lead} value={selectedMessage.leadName} />
              <Info label={dictionary.propertyReference} value={relatedProperty?.title ?? dictionary.notProvided} />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="eyebrow flex items-center gap-2">
                  <FileText size={15} /> {locale === "tr" ? "Sohbeti besle" : "Feed conversation"}
                </div>
                {selectedContext.length ? (
                  <Badge tone="success">
                    {selectedContext.length} {locale === "tr" ? "ek bilgi" : "notes"}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <textarea
                  value={contextDraft}
                  onChange={(event) => setContextDraft(event.target.value)}
                  placeholder={
                    locale === "tr"
                      ? "Başka platformdaki konuşmayı buraya yapıştır..."
                      : "Paste conversation from another platform..."
                  }
                  className="min-h-24 w-full resize-none rounded-lg border border-border bg-card p-3 font-body text-sm leading-5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <div className="flex flex-wrap items-start gap-2 lg:w-44 lg:flex-col">
                  <Button
                    size="sm"
                    onClick={addTextConversationContext}
                    disabled={!contextDraft.trim()}
                    className="h-9 min-h-9 flex-1 px-3 text-xs lg:w-full lg:flex-none"
                  >
                    <Sparkles size={14} /> {locale === "tr" ? "Metni ekle" : "Add text"}
                  </Button>
                  <label
                    htmlFor={`context-file-${selectedId}`}
                    className="inline-flex h-9 min-h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-ink bg-card px-3 font-heading text-xs font-bold text-foreground shadow-[2px_2px_0_0_#E0E0E8] transition-colors hover:bg-muted lg:w-full lg:flex-none"
                  >
                    <Upload size={14} /> {locale === "tr" ? "Dosya yükle" : "Upload file"}
                  </label>
                  <input
                    id={`context-file-${selectedId}`}
                    type="file"
                    accept={acceptedContextFileExtensions.join(",")}
                    className="sr-only"
                    onChange={(event) => {
                      void handleContextFileUpload(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
              </div>
              {selectedContext.length ? (
                <div className="mt-3 grid gap-2">
                  {selectedContext.slice(0, 3).map((context) => (
                    <div key={context.id} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-2">
                      <FileText size={14} className="mt-1 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-heading text-sm">{context.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{context.createdAt}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 font-body text-xs leading-5 text-muted-foreground">{context.text}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeConversationContext(context.id)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={locale === "tr" ? "Ek sohbet bilgisini kaldır" : "Remove supplemental conversation context"}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 font-body text-xs leading-5 text-muted-foreground">
                  {locale === "tr"
                    ? "Facebook dışındaki WhatsApp, e-posta veya portal konuşmalarını bu müşterinin AI analizine kat."
                    : "Add WhatsApp, email or portal context so AI can consider it for this customer."}
                </p>
              )}
            </div>
          </Panel>

          <Panel className="border-0 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow flex items-center gap-2"><MessageSquare size={15} /> {locale === "tr" ? "Müşteri simülasyonu" : "Customer Simulation"}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "tr"
                    ? "İkincil demo alanı: ana iş akışı aksiyon kartı, riskler ve insan onayıdır."
                    : "Secondary demo surface: the core workflow is the action card, risk checks and human approval."}
                </p>
              </div>
              {loading === "chat" ? <Badge tone="cold"><Loader2 className="animate-spin" size={13} /> {progressStep}</Badge> : null}
            </div>

            <div className="h-[32vh] min-h-[260px] overflow-y-auto border border-border rounded-lg bg-muted/20 p-3">
              <div className="space-y-3">
                {displayChat.map((chat) => (
                    <div key={chat.id} className={`flex ${chat.role === "agent" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[82%] border-2 p-3 font-body text-base leading-6 ${
                          chat.role === "agent" ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground"
                        }`}
                       
                      >
                        <div className="mb-1 text-xs opacity-70">{chat.role === "agent" ? "Agent" : selectedProfile.name} / {chat.createdAt}</div>
                        {chat.text}
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={locale === "tr" ? "Müşteriye mesaj yaz..." : "Write a customer message..."}
                className="min-h-20 w-full resize-none border border-border bg-card p-3 font-body text-base leading-6 outline-none"
               
              />
              <p className="font-body text-sm leading-5 text-muted-foreground">{dictionary.composerHint}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => sendAgentMessage()} disabled={loading !== null || !draft.trim()}>
                  <Send size={15} /> {dictionary.sendMessage}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendAgentMessage(draft.trim(), true)}
                  disabled={loading !== null || !draft.trim()}
                  title={dictionary.sendTermsOfferTitle}
                >
                  <Sparkles size={15} /> {dictionary.sendTermsOffer}
                </Button>
              </div>
            </div>
          </Panel>

        </main>

        <aside className="sticky top-[5.5rem] self-start">
          <Panel decoration="tack" className="flex max-h-[calc(100vh-150px)] flex-col overflow-hidden border-0">
            <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="eyebrow">{dictionary.leadWorkspace}</div>
                  <p className="mt-1 font-heading text-lg leading-6 text-foreground">{selectedMessage.leadName}</p>
                  <p className="mt-0.5 line-clamp-2 font-body text-sm text-muted-foreground">{dictionary.leadWorkspaceHint}</p>
                </div>
                <Badge tone={completedCount >= 3 ? "success" : completedCount > 0 ? "warm" : "neutral"}>
                  {completedCount}/5 {locale === "tr" ? "adım" : "steps"}
                </Badge>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <section className="border-b border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="eyebrow">{dictionary.actionCard}</div>
                <p className="mono-detail mt-1">
                  {actionCard ? `${Math.round(actionCard.confidence * 100)}% ${dictionary.confidence} / ${formatSource(actionCard.source, locale)}` : dictionary.waitingForAnalysis}
                </p>
              </div>
              <Button size="sm" onClick={() => generateCard(selectedMessage)} disabled={loading === "card"}>
                {loading === "card" ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
                {loading === "card" ? progressStep : dictionary.generateActionCard}
              </Button>
            </div>

            {actionCard ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {actionCard.intent.map((intent) => <Badge key={intent}>{formatIntent(intent, locale)}</Badge>)}
                  <Badge tone={actionCard.leadTemperature}>{formatTemperature(actionCard.leadTemperature, locale)}</Badge>
                  <Badge>{formatCustomerType(actionCard.customerType, locale)}</Badge>
                </div>
                <HumanApprovalBanner actionCard={actionCard} locale={locale} />
                <ComplianceGuardianBlock actionCard={actionCard} locale={locale} listingMarked={actionState.listingMarked} />
                <ConfidenceBlock actionCard={actionCard} locale={locale} />
                <MaterialInfoBlock actionCard={actionCard} locale={locale} />
                <WhyFlaggedBlock actionCard={actionCard} locale={locale} />
                <AlternativeMatchesBlock actionCard={actionCard} locale={locale} />
                <OpportunityBlock actionCard={actionCard} locale={locale} />
                <CompactBlock title={dictionary.suggestedReply} text={formatGeneratedActionText(actionCard.suggestedReply, locale)} strong />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button size="sm" onClick={approveSuggestedReply}>
                    <Send size={14} /> {dictionary.approveReply}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setDraft(formatGeneratedActionText(actionCard.suggestedReply, locale)); markAction("edited", "reply_edited", locale === "tr" ? "Cevap düzenleme alanına alındı." : "Reply moved into the editor."); }}>
                    <FilePenLine size={14} /> {dictionary.editReply}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => markAction("followUpCreated", "follow_up_created", actionCard.suggestedFollowUp)}>
                    <ClipboardCheck size={14} /> {dictionary.createFollowUp}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => markAction("listingMarked", "listing_marked", actionCard.suggestedListingAction)}>
                    <AlertTriangle size={14} /> {dictionary.markMissing}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => markAction("crmSaved", "crm_note_saved", actionCard.suggestedCrmNote)}>
                    <Save size={14} /> {dictionary.saveCrmNote}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => generateCard(selectedMessage)}>
                    <RefreshCcw size={14} /> {dictionary.regenerate}
                  </Button>
                </div>
                <StatusStrip actionState={actionState} dictionary={dictionary} completedCount={completedCount} />
                <CompactBlock title={dictionary.crmNote} text={formatGeneratedActionText(actionCard.suggestedCrmNote, locale)} />
                <CompactBlock title={dictionary.followUp} text={formatGeneratedActionText(actionCard.suggestedFollowUp, locale)} />
                <CompactBlock title={dictionary.listingAction} text={formatGeneratedActionText(actionCard.suggestedListingAction, locale)} />
                {actionCard.recommendedNextBestAction ? (
                  <CompactBlock title="Next best action" text={actionCard.recommendedNextBestAction} strong />
                ) : null}
                {actionCard.agentPlan ? <AgentPlanBlock actionCard={actionCard} locale={locale} /> : null}
                {actionCard.safetyChecks?.length ? (
                  <CardList
                    title="Safety checks"
                    items={actionCard.safetyChecks.map((check) => `${check.passed ? "OK" : "Review"}: ${check.label}`)}
                    empty={dictionary.noCriticalRisks}
                    tone="neutral"
                  />
                ) : null}
                <CardList title={dictionary.missingListingInformation} items={actionCard.missingFields.map((field) => formatMissingField(field, locale))} empty={dictionary.noMissingFields} tone="risk" />
                <CardList title={dictionary.riskFlags} items={actionCard.riskFlags.map((flag) => formatRiskFlag(flag.code, flag.label, locale))} empty={dictionary.noCriticalRisks} tone="risk" />
              </div>
            ) : (
              <div className="mt-4 min-h-40 border border-border rounded-lg p-4 font-body text-base leading-6 text-muted-foreground">
                {dictionary.emptyActionCard}
              </div>
            )}
            </section>

            <section className="border-b border-border p-4">
            <div className="eyebrow flex items-center gap-2"><Bot size={15} /> {dictionary.agenticSuggestions}</div>
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={suggestion.id === "generate-card" && loading === "card"}
                  className="w-full border border-border rounded-lg bg-muted/20 p-3 text-left hover:bg-muted/80 disabled:opacity-60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-base">{suggestion.label}</span>
                    {suggestion.critical ? <Badge tone="risk">HITL</Badge> : null}
                  </div>
                  <p className="mt-1 font-body text-sm leading-5 text-muted-foreground">{suggestion.reason}</p>
                </button>
              ))}
            </div>
            </section>

            <section className="p-4">
            <div className="eyebrow flex items-center gap-2"><History size={15} /> {dictionary.activityLog}</div>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {selectedEvents.length === 0 ? (
                <p className="font-body text-base text-muted-foreground">{dictionary.activityLogEmpty}</p>
              ) : selectedEvents.slice(0, 12).map((event) => (
                <div key={event.id} className="border-l-2 border-border pl-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-sm">{event.title}</span>
                    <span className="text-xs text-muted-foreground">{event.createdAt}</span>
                  </div>
                  <p className="font-body text-sm leading-5 text-muted-foreground">{event.detail}</p>
                </div>
              ))}
            </div>
            </section>
            </div>
          </Panel>
        </aside>
      </div>

      {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 font-body text-sm text-amber-900 shadow-hard">{error}</div> : null}
      {toast ? <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-border bg-card shadow-hard p-3 font-body text-base shadow-hard">{toast}</div> : null}
    </div>
  );
}

function HumanApprovalBanner({ actionCard, locale }: { actionCard: ActionCard; locale: Locale }) {
  const needsReview = actionCard.replyRiskLocked || actionCard.missingFields.length > 0 || actionCard.confidenceLevel === "low";
  return (
    <div className="border-2 border-amber-600/40 bg-amber-500/10 p-3">
      <div className="flex items-start gap-2">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-200" />
        <div>
          <div className="font-heading text-sm">
            {needsReview
              ? locale === "tr"
                ? "Göndermeden önce incele"
                : "Review before sending"
              : locale === "tr"
                ? "İnsan onayı gerekli"
                : "Human approval required"}
          </div>
          <p className="font-body text-sm leading-5 text-muted-foreground">
            {locale === "tr"
              ? "AI tespit eder, yapılandırır ve önerir; danışman doğrular, onaylar ve gönderir."
              : "AI detects, structures and recommends; the agent verifies, approves and sends."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ComplianceGuardianBlock({
  actionCard,
  locale,
  listingMarked,
}: {
  actionCard: ActionCard;
  locale: Locale;
  listingMarked: boolean;
}) {
  const decision = actionCard.legalGuardDecision;
  if (!decision) return null;

  const tone = decision.status === "PASS" ? "success" : decision.status === "WARN" ? "warm" : "risk";
  const canProceed = decision.status !== "FAIL" || listingMarked;
  const title =
    locale === "tr"
      ? decision.status === "PASS"
        ? "Legal Guardian: geçiş verildi"
        : decision.status === "WARN"
          ? "Legal Guardian: uyarı ile devam"
          : "Legal Guardian: gönderim kilidi"
      : decision.status === "PASS"
        ? "Legal Guardian: clear to proceed"
        : decision.status === "WARN"
          ? "Legal Guardian: proceed with warning"
          : "Legal Guardian: send locked";

  return (
    <div className={`border-2 p-3 ${decision.status === "FAIL" ? "border-red-500/40 bg-red-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-heading text-sm">
            <ShieldCheck size={16} /> {title}
          </div>
          <p className="mt-1 font-body text-sm leading-5 text-muted-foreground">{decision.summary}</p>
        </div>
        <Badge tone={tone}>{decision.status}</Badge>
      </div>
      <div className="mt-3 grid gap-2">
        {decision.issues.slice(0, 3).map((issue) => (
          <div key={`${issue.field}-${issue.reason}`} className="border border-foreground/10 bg-card p-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-heading text-sm">{issue.field}</span>
              <Badge tone={issue.severity === "high" ? "risk" : "warm"}>{issue.severity}</Badge>
            </div>
            <p className="mt-1 font-body text-xs leading-5 text-muted-foreground">{issue.requiredAction}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={canProceed ? "success" : "risk"}>
          {canProceed ? (locale === "tr" ? "Audit kaydıyla devam" : "Proceed with audit") : locale === "tr" ? "Cevap blokeli" : "Reply blocked"}
        </Badge>
        <Badge tone="neutral">DMCC</Badge>
        <Badge tone="neutral">{locale === "tr" ? "Material information" : "Material information"}</Badge>
      </div>
    </div>
  );
}

function ConfidenceBlock({ actionCard, locale }: { actionCard: ActionCard; locale: Locale }) {
  const level = actionCard.confidenceLevel ?? (actionCard.confidence > 0.82 ? "high" : actionCard.confidence > 0.68 ? "medium" : "low");
  const tone = level === "high" ? "success" : level === "medium" ? "warm" : "risk";
  const label = locale === "tr" ? (level === "high" ? "Yüksek" : level === "medium" ? "Orta" : "Düşük") : level[0].toUpperCase() + level.slice(1);
  return (
    <div className="grid gap-2 border border-border rounded-lg bg-muted/20 p-3 sm:grid-cols-[1fr_auto]">
      <div>
        <div className="eyebrow flex items-center gap-2"><Gauge size={15} /> {locale === "tr" ? "AI güven seviyesi" : "AI Confidence"}</div>
        <p className="mt-1 font-body text-sm leading-5 text-muted-foreground">
          {locale === "tr"
            ? "Eşleşme netliği, ilan alanları ve müsaitlik güncelliği birlikte değerlendirilir."
            : "Based on property match clarity, listing completeness and fresh availability."}
        </p>
      </div>
      <Badge tone={tone}>{label} / {Math.round(actionCard.confidence * 100)}%</Badge>
    </div>
  );
}

function MaterialInfoBlock({ actionCard, locale }: { actionCard: ActionCard; locale: Locale }) {
  const items = actionCard.materialInfoCheck ?? [];
  if (!items.length) return null;
  return (
    <div>
      <div className="eyebrow mb-2 flex items-center gap-2"><ShieldCheck size={15} /> {locale === "tr" ? "Material Information kontrolü" : "Material Information Check"}</div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.field} className="flex items-start justify-between gap-3 border border-foreground/10 bg-card px-3 py-2">
            <span className="font-body text-sm text-foreground">{item.field}</span>
            <span className={`text-right font-body text-sm ${item.requiresVerification ? "text-amber-800" : "text-muted-foreground"}`}>
              {formatMaterialStatus(item.status, locale)} · {item.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhyFlaggedBlock({ actionCard, locale }: { actionCard: ActionCard; locale: Locale }) {
  const items = actionCard.whyFlagged ?? [];
  if (!items.length) return null;
  return (
    <div>
      <div className="eyebrow mb-2 flex items-center gap-2"><Target size={15} /> {locale === "tr" ? "Neden dikkat gerekiyor" : "Why this needs attention"}</div>
      <ul className="space-y-1 border border-border rounded-lg bg-muted/20 p-3">
        {items.slice(0, 5).map((item) => (
          <li key={item} className="font-body text-sm leading-5 text-muted-foreground">- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function AlternativeMatchesBlock({ actionCard, locale }: { actionCard: ActionCard; locale: Locale }) {
  const matches = actionCard.alternativeMatches ?? [];
  if (!matches.length) return null;
  return (
    <div className="border border-border bg-muted/40 p-3">
      <div className="eyebrow mb-1 flex items-center gap-2"><Home size={15} /> {locale === "tr" ? "Alternatif eşleşmeler" : "Alternative Matches"}</div>
      <p className="mb-3 font-body text-sm leading-5 text-muted-foreground">
        {actionCard.suggestedNextAction ?? (locale === "tr" ? "Lead'i kaybetmeden benzer müsait ilan öner." : "Keep the lead warm with similar available listings.")}
      </p>
      <div className="grid gap-2">
        {matches.map((match) => (
          <div key={match.id} className="border border-foreground/15 bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-heading text-sm">{match.title}</div>
                <p className="font-body text-sm text-muted-foreground">{match.location} / {match.price}</p>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-foreground" />
            </div>
            <p className="mt-1 font-body text-sm leading-5 text-muted-foreground">{match.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunityBlock({ actionCard, locale }: { actionCard: ActionCard; locale: Locale }) {
  const insights = actionCard.opportunityInsights ?? [];
  if (!insights.length) return null;
  return (
    <div>
      <div className="eyebrow mb-2 flex items-center gap-2"><Sparkles size={15} /> {locale === "tr" ? "İkincil fırsat insight'ı" : "Secondary Opportunity Insight"}</div>
      {insights.map((insight) => (
        <div key={insight.label} className="border border-border rounded-lg bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-sm">{insight.label}</span>
            <Badge tone={insight.priority === "high" ? "hot" : insight.priority === "medium" ? "warm" : "cold"}>{insight.priority}</Badge>
          </div>
          <p className="mt-1 font-body text-sm leading-5 text-muted-foreground">{insight.detail}</p>
        </div>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-muted/30 p-2">
      <div className="eyebrow truncate">{label}</div>
      <div className="mt-1 truncate font-body text-sm text-foreground">{value}</div>
    </div>
  );
}

function BriefCard({
  title,
  items,
  footer,
  tone = "neutral",
  emphasis = false,
}: {
  title: string;
  items: string[];
  footer?: string;
  tone?: "neutral" | "risk";
  emphasis?: boolean;
}) {
  return (
    <div
      className={`min-h-36 border-2 p-3 ${
        emphasis ? "border-amber-200 bg-amber-50/50" : tone === "risk" ? "border-amber-200 bg-amber-50" : "border-foreground/20 bg-card"
      }`}
     
    >
      <div className="eyebrow mb-2">{title}</div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item, index) => (
          <p key={`${title}-${index}`} className="font-body text-sm leading-5 text-foreground">
            {item}
          </p>
        ))}
      </div>
      {footer ? <div className="mono-detail mt-3 border-t border-foreground/15 pt-2 text-xs">{footer}</div> : null}
    </div>
  );
}

function AgentPlanBlock({ actionCard, locale }: { actionCard: ActionCard; locale: Locale }) {
  const plan = actionCard.agentPlan;
  if (!plan) return null;

  const facts = actionCard.factsUsed?.length ? actionCard.factsUsed : plan.knownFacts;
  const steps = actionCard.actionPlan ?? [];

  return (
    <div className="border border-border rounded-lg bg-muted/20 p-3">
      <div className="eyebrow mb-2">Agent plan</div>
      <p className="font-body text-sm leading-5 text-foreground">{plan.goal}</p>
      <div className="mt-3 grid gap-3">
        <div>
          <div className="mono-detail mb-1">Evidence / facts used</div>
          <ul className="space-y-1">
            {facts.slice(0, 4).map((fact) => (
              <li key={fact} className="font-body text-sm leading-5 text-muted-foreground">- {fact}</li>
            ))}
          </ul>
        </div>
        {steps.length ? (
          <div>
            <div className="mono-detail mb-1">Action sequence</div>
            <div className="space-y-2">
              {steps.slice(0, 3).map((step) => (
                <div key={`${step.label}-${step.detail}`} className="border-l-2 border-sketch-pen pl-2">
                  <div className="font-heading text-sm">{step.label}</div>
                  <p className="font-body text-sm leading-5 text-muted-foreground">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CompactBlock({ title, text, strong = false }: { title: string; text: string; strong?: boolean }) {
  return (
    <div>
      <div className="eyebrow mb-1">{title}</div>
      <div
        className={`${strong ? "border-l-2 border-primary/35 bg-sketch-postit/30" : "border border-border rounded-lg bg-card"} p-3 font-body text-sm leading-6 text-foreground`}
       
      >
        {text}
      </div>
    </div>
  );
}

function CardList({ title, items, empty, tone }: { title: string; items: string[]; empty: string; tone: "risk" | "neutral" }) {
  return (
    <div>
      <div className="eyebrow mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((item) => <Badge key={item} tone={tone}>{item}</Badge>) : <span className="font-body text-sm text-muted-foreground">{empty}</span>}
      </div>
    </div>
  );
}

function StatusStrip({
  actionState,
  dictionary,
  completedCount,
}: {
  actionState: ActionState;
  dictionary: ReturnType<typeof getDictionary>;
  completedCount: number;
}) {
  return (
    <div className="border border-border rounded-lg bg-muted/20 p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">Workflow state</span>
        <Badge tone={completedCount ? "success" : "neutral"}>{completedCount}/5</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(actionState).map(([key, value]) => (
          <Badge key={key} tone={value ? "success" : "neutral"}>
            {value ? <Check size={12} /> : null}
            {dictionary.actions[key as keyof typeof dictionary.actions]}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function formatMaterialStatus(status: string, locale: Locale) {
  const en: Record<string, string> = {
    verified: "Verified",
    missing: "Missing",
    stale: "Stale",
    updated: "Updated",
    not_applicable: "N/A",
  };
  const tr: Record<string, string> = {
    verified: "Doğrulandı",
    missing: "Eksik",
    stale: "Güncel değil",
    updated: "Güncel",
    not_applicable: "Uygulanmaz",
  };
  return (locale === "tr" ? tr : en)[status] ?? status;
}

function buildInboxAnalysisMessages(
  message: CustomerMessage,
  chatMessages: ChatMessage[],
  supplementalContext: ConversationContextSource[] = [],
): InboxAnalysisMessage[] {
  return [
    {
      id: message.id,
      role: "customer",
      text: `${message.subject}. ${message.message}`,
      createdAt: message.receivedAt,
    },
    ...supplementalContext.map((context) => ({
      id: context.id,
      role: "system" as const,
      text: `Supplemental conversation context (${context.title}): ${context.text}`,
      createdAt: context.createdAt,
    })),
    ...chatMessages.map((chat) => ({
      id: chat.id,
      role: chat.role,
      text: chat.text,
      createdAt: chat.createdAt,
    })),
  ];
}

function getMessagesAfterLastAnalysis(
  message: CustomerMessage,
  chatMessages: ChatMessage[],
  insight?: ConversationAiInsight,
  supplementalContext: ConversationContextSource[] = [],
): InboxAnalysisMessage[] {
  const conversationMessages = buildInboxAnalysisMessages(message, chatMessages, supplementalContext);
  if (!insight) return conversationMessages;
  const lastAnalyzedIndex = conversationMessages.findIndex((item) => item.id === insight.lastAnalyzedMessageId);
  return lastAnalyzedIndex >= 0 ? conversationMessages.slice(lastAnalyzedIndex + 1) : conversationMessages;
}

function getAiInboxPriority(
  insight: ConversationAiInsight,
  locale: Locale,
): { label: string; reason: string; tone: "neutral" | "hot" | "warm" | "cold" | "risk" | "success" } {
  const labels = {
    hot: locale === "tr" ? "Hot" : "Hot",
    warm: locale === "tr" ? "Warm" : "Warm",
    cold: locale === "tr" ? "Cold" : "Cold",
  };
  return {
    label: labels[insight.priority],
    reason: insight.reason,
    tone: insight.priority,
  };
}

function getInboxPriority(message: CustomerMessage, locale: Locale): { label: string; reason: string; tone: "neutral" | "hot" | "warm" | "cold" | "risk" | "success" } {
  const text = `${message.subject} ${message.message}`.toLowerCase();
  const viewing = text.includes("view") || text.includes("viewing") || text.includes("gör");
  const valuation = text.includes("valuation") || text.includes("selling") || text.includes("sell our current home") || text.includes("değerleme") || text.includes("sat");
  const oldFollowUp = message.status === "reviewing";
  if (viewing) return { label: locale === "tr" ? "Yüksek" : "High", reason: locale === "tr" ? "Evi görme talebi" : "Viewing Request", tone: "hot" };
  if (valuation) return { label: locale === "tr" ? "Yüksek" : "High", reason: locale === "tr" ? "Değerleme fırsatı" : "Valuation Opportunity", tone: "hot" };
  if (oldFollowUp) return { label: locale === "tr" ? "Düşük" : "Low", reason: locale === "tr" ? "Eski takip" : "Old Follow-up", tone: "cold" };
  return { label: locale === "tr" ? "Orta" : "Medium", reason: locale === "tr" ? "Genel talep" : "General Enquiry", tone: "warm" };
}

function getFollowUpRisk(message: CustomerMessage, index: number, locale: Locale) {
  const highIntentWaiting = message.initialTemperature === "hot" && message.status === "new";
  if (message.status === "reviewing" && index % 2 === 0) return locale === "tr" ? "3 gündür cevap yok" : "No response for 3 days";
  if (message.status === "reviewing") return locale === "tr" ? "Takip gecikti" : "Follow-up overdue";
  if (highIntentWaiting) return locale === "tr" ? "Yüksek niyetli lead bekliyor" : "High-intent lead waiting";
  return null;
}

function buildSuggestions(
  message: CustomerMessage,
  customerName: string,
  actionCard: ActionCard | null,
  actionState: ActionState,
  events: ActivityEvent[],
  locale: Locale,
): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];
  if (!actionCard) {
    suggestions.push({
      id: "generate-card",
      label: locale === "tr" ? "Önce aksiyon kartı oluştur" : "Generate the action card first",
      reason: locale === "tr" ? "Sistem niyet, risk ve ilan eksiklerini henüz çıkarmadı." : "Intent, risks and missing listing fields have not been extracted yet.",
      actionText: "",
      critical: true,
    });
    return suggestions;
  }
  if (actionCard.actionPlan?.length) {
    actionCard.actionPlan.forEach((step, index) => {
      suggestions.push({
        id: `agent-plan-${index}`,
        label: step.label,
        reason: step.detail,
        actionText: step.detail,
        critical: step.priority === "high",
      });
    });
  }
  if (actionCard.missingFields.length && !actionState.listingMarked) {
    suggestions.push({
      id: "mark-missing",
      label: locale === "tr" ? "Eksik ilanı işaretle" : "Flag missing listing info",
      reason: locale === "tr" ? "Müşteriye kesin bilgi vermeden önce eksik alan görünür olmalı." : "The missing field should be visible before any firm customer promise.",
      actionText: actionCard.suggestedListingAction,
      critical: true,
    });
  }
  if (!actionState.followUpCreated) {
    suggestions.push({
      id: "follow-up",
      label: locale === "tr" ? "Takip görevi oluştur" : "Create a follow-up",
      reason: locale === "tr" ? `${customerName} için sonraki adım takip edilmezse sıcaklık düşebilir.` : `${customerName}'s next step can go cold if it is not tracked.`,
      actionText: actionCard.suggestedFollowUp,
    });
  }
  if (!events.some((event) => event.type === "agent_message_sent" || event.type === "offer_sent")) {
    suggestions.push({
      id: "send-reply",
      label: locale === "tr" ? "Onaylı cevabı gönder" : "Send the approved reply",
      reason: locale === "tr" ? "Müşteri henüz görüşmede cevap almadı." : "The customer has not received an agent response in the conversation yet.",
      actionText: actionCard.suggestedReply,
    });
  }
  suggestions.push({
    id: "crm-note",
    label: locale === "tr" ? "Kayıt hafızasını güncelle" : "Update operating memory",
    reason: locale === "tr" ? "Gün sonu özeti ve sonraki öneriler bu kayıttan beslenecek." : "End-of-day recap and next suggestions will use this event trail.",
    actionText: actionCard.suggestedCrmNote,
  });
  return suggestions.slice(0, 4);
}
