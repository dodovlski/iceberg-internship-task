export type Locale = "en" | "tr";

export type LeadTemperature = "cold" | "warm" | "hot";
export type InboxPriority = "cold" | "warm" | "hot";
export type CustomerType = "buyer" | "tenant" | "seller" | "landlord" | "unknown";
export type MessageStatus = "new" | "reviewing" | "actioned";
export type PropertyAvailability = "available" | "under_offer" | "let_agreed" | "sold";
export type BriefingType = "morning" | "eod";
export type ActivityEventType =
  | "message_selected"
  | "conversation_context_added"
  | "action_card_generated"
  | "compliance_checked"
  | "compliance_blocked"
  | "agent_message_sent"
  | "customer_reply_received"
  | "reply_approved"
  | "reply_edited"
  | "follow_up_created"
  | "listing_marked"
  | "crm_note_saved"
  | "briefing_generated"
  | "task_completed"
  | "offer_sent";

export type Property = {
  id: string;
  title: string;
  titleTr?: string;
  location: string;
  locationTr?: string;
  type: "Flat" | "Studio" | "House";
  bedrooms: number;
  bathrooms: number;
  price: string;
  availability: PropertyAvailability;
  epc: string | null;
  councilTax: string | null;
  parking: string | null;
  parkingTr?: string | null;
  petsAllowed?: boolean | null;
  features?: string[];
  featuresTr?: string[];
  serviceCharge?: string | null;
  groundRent?: string | null;
  tenure?: string;
  leaseLength?: string | null;
  lastUpdatedHoursAgo: number;
  description?: string;
  descriptionTr?: string;
  imageUrl?: string;
};

export type ListingUpdateChange = {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
  confidence: number;
  requiresReview: boolean;
};

export type ListingUpdateDraft = {
  propertyId: string;
  inputText: string;
  summary: string;
  changes: ListingUpdateChange[];
  proposedDescription: string;
  confidence: number;
  riskFlags: string[];
  source: "gemini" | "fallback";
  extracted: {
    price?: string;
    petsAllowed?: boolean;
    parking?: string;
    epc?: string;
    councilTax?: string;
    features?: string[];
    availability?: PropertyAvailability;
  };
};

export type LegalGuardAction = "save_draft" | "publish_listing" | "send_customer_reply" | "portal_sync" | "weekly_audit";

export type LegalGuardStatus = "PASS" | "WARN" | "FAIL";

export type LegalDocumentRuleField =
  | "EPC"
  | "Council Tax"
  | "Parking"
  | "Service Charge"
  | "Ground Rent"
  | "Availability"
  | "Tenure"
  | "Lease Length"
  | "Other";

export type LegalDocumentRule = {
  field: LegalDocumentRuleField;
  requirement: string;
  severity: "low" | "medium" | "high";
  blocksPublish: boolean;
  appliesWhen?: string;
  evidence?: string;
};

export type LegalDocumentSource = {
  status: "loaded" | "missing" | "ai_unavailable" | "unreadable";
  fileName: string;
  summary: string;
  rules: LegalDocumentRule[];
  checkedAt: string;
  updatedAt?: string;
  error?: string;
};

export type LegalGuardIssue = {
  field: string;
  severity: "low" | "medium" | "high";
  reason: string;
  requiredAction: string;
  blocksPublish: boolean;
  source?: "built_in" | "legal_document";
  evidence?: string;
};

export type LegalGuardDecision = {
  status: LegalGuardStatus;
  action: LegalGuardAction;
  propertyId: string;
  propertyTitle: string;
  summary: string;
  lawBasis: string[];
  issues: LegalGuardIssue[];
  allowedActions: LegalGuardAction[];
  checkedAt: string;
};

export type LegalAuditReport = {
  status: LegalGuardStatus;
  checkedAt: string;
  summary: string;
  totals: {
    checked: number;
    pass: number;
    warn: number;
    fail: number;
  };
  decisions: LegalGuardDecision[];
  legalDocument?: LegalDocumentSource;
};

export type CustomerMessage = {
  id: string;
  leadName: string;
  subject: string;
  channel: "Website Form" | "Rightmove" | "Zoopla" | "Email";
  status: MessageStatus;
  receivedAt: string;
  receivedAtTr?: string;
  propertyReference?: string;
  propertyReferenceId?: string;
  localized?: Partial<Record<Locale, Pick<CustomerMessage, "leadName" | "subject" | "message" | "receivedAt">>>;
  message: string;
  initialTemperature: LeadTemperature;
};

export type CustomerProfile = {
  id: string;
  messageId: string;
  name: string;
  archetype: string;
  decisionStyle: string;
  communicationStyle: string;
  expectations: string[];
  mainProblem: string;
  trustSignals: string[];
  objections: string[];
  urgency: "low" | "medium" | "high";
  preferredOutcome: string;
  memory: string[];
  localized?: Partial<Record<Locale, Partial<Omit<CustomerProfile, "localized" | "messageId" | "id">>>>;
};

export type ChatMessage = {
  id: string;
  messageId: string;
  role: "agent" | "customer" | "system";
  text: string;
  createdAt: string;
};

export type ConversationContextSource = {
  id: string;
  messageId: string;
  source: "pasted_text" | "uploaded_file";
  title: string;
  text: string;
  createdAt: string;
};

export type InboxAnalysisMessage = {
  id: string;
  role: "agent" | "customer" | "system";
  text: string;
  createdAt: string;
};

export type ConversationAiInsight = {
  conversationId: string;
  priority: InboxPriority;
  score: number;
  reason: string;
  summary: string;
  lastAnalyzedMessageId: string;
  lastAnalyzedAt: string;
  modelVersion: string;
  source: "gemini" | "fallback";
};

export type InboxPrioritizationItem = {
  conversationId: string;
  leadName: string;
  subject: string;
  status: MessageStatus;
  receivedAt: string;
  propertyReference?: string;
  previousInsight?: ConversationAiInsight;
  newMessages: InboxAnalysisMessage[];
  supplementalContext?: ConversationContextSource[];
};

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  messageId?: string;
  customerName?: string;
  title: string;
  detail: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | string[]>;
};

export type AgentSuggestion = {
  id: string;
  label: string;
  reason: string;
  actionText: string;
  critical?: boolean;
};

export type AgentToolCall = {
  name: string;
  input: Record<string, string | number | boolean | string[] | null>;
  outputSummary: string;
  status: "success" | "blocked";
};

export type AgentPlan = {
  goal: string;
  requiredTools: string[];
  knownFacts: string[];
  unknowns: string[];
  risks: string[];
  requiresHumanApproval: boolean;
};

export type ActionStep = {
  label: string;
  detail: string;
  priority: "high" | "medium" | "low";
  owner: "agent" | "system";
};

export type SafetyCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

export type ConfidenceBreakdown = {
  propertyMatch: number;
  dataCompleteness: number;
  replySafety: number;
};

export type RiskFlag = {
  code: string;
  label: string;
  severity: "low" | "medium" | "high";
};

export type ConfidenceLevel = "high" | "medium" | "low";

export type MaterialInfoStatus = "verified" | "missing" | "stale" | "updated" | "not_applicable";

export type MaterialInfoItem = {
  field: "EPC" | "Council Tax" | "Parking" | "Service Charge" | "Ground Rent" | "Availability" | "Tenure" | "Lease Length";
  status: MaterialInfoStatus;
  detail: string;
  requiresVerification: boolean;
};

export type AlternativeMatch = {
  id: string;
  title: string;
  location: string;
  price: string;
  availability: PropertyAvailability;
  reason: string;
};

export type OpportunityInsight = {
  label: string;
  detail: string;
  priority: "high" | "medium" | "low";
};

export type ActionCard = {
  messageId: string;
  intent: string[];
  customerType: CustomerType;
  leadTemperature: LeadTemperature;
  matchedProperty: Pick<Property, "id" | "title" | "location"> | null;
  confidence: number;
  confidenceLevel?: ConfidenceLevel;
  missingFields: string[];
  materialInfoCheck?: MaterialInfoItem[];
  riskFlags: RiskFlag[];
  whyFlagged?: string[];
  suggestedReply: string;
  suggestedCrmNote: string;
  suggestedFollowUp: string;
  suggestedListingAction: string;
  suggestedNextAction?: string;
  alternativeMatches?: AlternativeMatch[];
  opportunityInsights?: OpportunityInsight[];
  approvalStatus: "pending" | "approved" | "edited";
  replyRiskLocked: boolean;
  source: "gemini" | "fallback";
  agentPlan?: AgentPlan;
  toolCalls?: AgentToolCall[];
  factsUsed?: string[];
  evidence?: string[];
  unknowns?: string[];
  blockedActions?: string[];
  recommendedNextBestAction?: string;
  actionPlan?: ActionStep[];
  confidenceBreakdown?: ConfidenceBreakdown;
  safetyChecks?: SafetyCheck[];
  legalGuardDecision?: LegalGuardDecision;
  complianceSummary?: string;
};

export type Briefing = {
  type: BriefingType;
  title: string;
  summary: string;
  priorities: string[];
  risks: string[];
  recommendedActions: string[];
  source: "gemini" | "fallback";
  toolCalls?: AgentToolCall[];
  operatingInsights?: string[];
  unresolvedItems?: string[];
};
