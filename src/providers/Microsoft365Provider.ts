import type { ProviderHealth } from './types'

export type EmailClassification =
  | 'QUOTE_REQUEST'
  | 'QUOTE_SENT'
  | 'QUOTE_REVISION'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'ORDER_CONFIRMATION'
  | 'IRRELEVANT'
  | 'POSSIBLE_COMMERCIAL_INTERACTION'

export interface CommercialEmail {
  id: string
  messageId: string
  internetMessageId: string
  conversationId: string
  subject: string
  bodyPreview: string
  bodyReference?: string
  from: string
  fromName?: string
  to: string[]
  cc?: string[]
  receivedDateTime: string
  sentDateTime?: string
  isDraft?: boolean
  hasAttachments: boolean
  categories?: string[]
  customerId?: string
  contactId?: string
  opportunityId?: string
  quoteId?: string
  classification?: EmailClassification
}

export interface EmailQueryOptions {
  limit?: number
  fromDate?: string
  toDate?: string
  conversationId?: string
  categories?: string[]
  includeAttachments?: boolean
}

export interface MSContact {
  id: string
  displayName: string
  givenName?: string
  surname?: string
  emailAddresses: Array<{ address: string; name?: string }>
  businessPhones?: string[]
  mobilePhone?: string
  companyName?: string
  jobTitle?: string
  department?: string
}

export interface ContactSyncResult {
  totalSynced: number
  matchedExisting: number
  suggestionsCreated: number
  newContactsSuggested: number
  syncedAt: string
}

export interface ContactUpdateSuggestion {
  id: string
  contact_id: string
  field_name: 'phone' | 'email' | 'jobTitle' | 'companyName' | 'contact_name'
  ms_value: string
  crm_value: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  created_at?: string
  resolved_at?: string
}

export interface CommercialEvent {
  id: string
  subject: string
  start: string
  end: string
  location?: string
  isOnlineMeeting?: boolean
  onlineMeetingUrl?: string
  organizer: { email: string; name?: string }
  attendees: Array<{ email: string; name?: string; status?: string }>
  customerId?: string
  customerName?: string
  contactId?: string
  isCommercial: boolean
  isPrivate?: boolean
  bodyPreview?: string
}

export interface DateRange {
  start: string
  end: string
}

export interface Subscription {
  id: string
  resource: string
  expirationDateTime: string
  changeType: 'created' | 'updated' | 'deleted'
  notificationUrl: string
  clientState?: string
}

export interface Interaction {
  id?: string
  customer_id?: string
  contact_id?: string
  seller_id?: string
  opportunity_id?: string
  quote_id?: string
  channel:
    | 'email'
    | 'whatsapp'
    | 'phone'
    | 'visit'
    | 'sap_quote'
    | 'sap_order'
    | 'task'
    | 'annotation'
  direction: 'inbound' | 'outbound' | 'internal'
  occurred_at: string
  source: string
  external_id?: string
  subject?: string
  email_from?: string
  email_to?: string
  email_cc?: string
  body_preview?: string
  body_reference?: string
  message_id?: string
  conversation_id?: string
  internet_message_id?: string
  has_attachments?: boolean
  email_classification?: EmailClassification
  summary?: string
  detected_intent?: string
  sentiment?: string
  product_mentions?: string
  quantity_mentions?: string
  competitor?: string
  competitor_price?: string
  objections?: string
  next_action?: string
  ai_confidence?: number
  created_by_system?: boolean
}

export interface CommercialEmailDraftRequest {
  recipientEmail: string
  recipientName: string
  customerName: string
  intent: 'QUOTE_SENT' | 'FOLLOW_UP' | 'NEGOTIATION' | 'PRICE_TABLE' | 'RECONNECT'
  quoteId?: string
  quoteValue?: number
  productsMentioned?: string[]
  specialConditions?: string
  sellerName?: string
}

export interface CommercialEmailDraftResult {
  subject: string
  body: string
  suggestedAttachments?: string[]
  confidence: number
  generatedAt: string
}

export interface Microsoft365Provider {
  readonly name: string
  readonly mode: 'MOCK' | 'REAL'

  // E-mails comerciais
  getCommercialEmails(
    customerId?: string,
    contactId?: string,
    options?: EmailQueryOptions,
  ): Promise<CommercialEmail[]>
  processInboundEmail(email: CommercialEmail): Promise<Interaction>
  processOutboundEmail(email: CommercialEmail): Promise<Interaction>

  // Contatos
  syncContacts(userId: string): Promise<ContactSyncResult>
  getContactByEmail(email: string): Promise<MSContact | null>
  suggestContactUpdates(contactId: string): Promise<ContactUpdateSuggestion[]>

  // Calendário comercial
  getCommercialEvents(
    customerId?: string,
    contactId?: string,
    dateRange?: DateRange,
  ): Promise<CommercialEvent[]>

  // Webhooks / Subscriptions
  subscribeToNotifications(resource: string): Promise<Subscription>
  renewSubscription(subscriptionId: string): Promise<Subscription>

  // Health & Observabilidade
  getHealth(): Promise<ProviderHealth>
  isDemoData(): boolean
  getLastSync(): string
}
