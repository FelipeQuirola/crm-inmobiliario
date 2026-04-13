export type Role = 'ADMIN' | 'VENDEDOR';

export type LeadStatus = 'ACTIVE' | 'PAUSED' | 'WON' | 'LOST';

export type LeadSource =
  | 'MANUAL'
  | 'WEBSITE'
  | 'FACEBOOK'
  | 'GOOGLE'
  | 'WHATSAPP'
  | 'REFERRAL'
  | 'OTHER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  avatarUrl?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  tenant: { name: string; slug: string };
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
  description: string | null;
  isDefault?: boolean;
  checklists?: StageChecklistItem[];
  _count?: { leads: number; checklists: number };
}

export interface StageChecklistItem {
  id: string;
  stageId: string;
  text: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadChecklistProgress {
  id: string;
  text: string;
  order: number;
  isDone: boolean;
  doneAt: string | null;
  progressId: string | null;
}

export interface LeadStageHistory {
  id: string;
  stageName: string;
  enteredAt: string;
  exitedAt: string | null;
  daysInStage: number | null;
  stage: { id: string; name: string; color: string } | null;
}

export interface LossReason {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count?: { leads: number };
}

export interface LeadAssignee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  propertyInterest: string | null;
  budget: number | null;
  lostReason: string | null;
  lossReasonId: string | null;
  lossReason?: { id: string; name: string } | null;
  lastContactAt: string | null;
  nextActionAt: string | null;
  daysInCurrentStage: number;
  assignedToId: string | null;
  assignedTo: LeadAssignee | null;
  stageId: string | null;
  stage: PipelineStage | null;
  score?: { score: number; temperature: LeadTemperature; urgency: string } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadsListResponse {
  data: Lead[];
  total: number;
  nextCursor: string | null;
}

export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  source?: LeadSource;
  propertyInterest?: string;
  budget?: number;
  assignedToId?: string;
  stageId?: string;
}

export interface ListLeadsParams {
  status?: LeadStatus;
  stageId?: string;
  assignedToId?: string;
  source?: LeadSource;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  _count?: { assignedLeads: number };
}

export interface TenantUserDetail extends TenantUser {
  assignedLeads: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: LeadStatus;
    stage: { id: string; name: string; color: string } | null;
    createdAt: string;
  }[];
  metrics: { totalLeads: number; activeLeads: number; wonLeads: number };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

export type ActivityType =
  | 'LEAD_CREATED'
  | 'STAGE_CHANGED'
  | 'REASSIGNED'
  | 'STATUS_CHANGED'
  | 'NOTE'
  | 'CALL'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'MEETING';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
}

/** Lead con actividades recientes — devuelto por GET /leads/:id */
export interface LeadDetail extends Lead {
  activities: Activity[];
}

// ─── Activities ───────────────────────────────────────────────────────────────

export type ManualActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING';

export interface CreateActivityInput {
  type: ManualActivityType;
  description: string;
  metadata?: {
    duration?: number;    // minutes — for CALL
    scheduledAt?: string; // ISO datetime — for MEETING
  };
}

export interface ActivityPage {
  data: Activity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export interface PipelineLead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  budget: number | null;
  propertyInterest: string | null;
  nextActionAt: string | null;
  stageId: string | null;
  daysInCurrentStage: number;
  assignedTo: { id: string; name: string; avatarUrl?: string | null } | null;
  checklistProgress?: { isDone: boolean; checklistId: string }[];
  score?: { score: number; temperature: LeadTemperature; urgency: string } | null;
}

export interface PipelineColumn extends Omit<PipelineStage, 'checklists'> {
  leads: PipelineLead[];
  checklists: { id: string }[];
}

export interface PipelineBoard {
  stages: PipelineColumn[];
  unassigned: PipelineLead[];
}

// ─── Properties ───────────────────────────────────────────────────────────────

export type PropertyType =
  | 'CASA'
  | 'APARTAMENTO'
  | 'TERRENO'
  | 'OFICINA'
  | 'LOCAL'
  | 'BODEGA';

export type PropertyStatus = 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA' | 'INACTIVA';

export interface Property {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  currency: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  address: string | null;
  city: string | null;
  sector: string | null;
  lat: number | null;
  lng: number | null;
  features: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  _count: { interestedLeads: number };
}

export interface PropertyDetail extends Property {
  interestedLeads: {
    id: string;
    notes: string | null;
    createdAt: string;
    lead: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string | null;
      status: LeadStatus;
      assignedTo: { id: string; name: string } | null;
    };
  }[];
}

export interface PropertiesListResponse {
  data: Property[];
  total: number;
  nextCursor: string | null;
}

export interface CreatePropertyInput {
  title: string;
  description?: string;
  type: PropertyType;
  status?: PropertyStatus;
  price: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  address?: string;
  city?: string;
  sector?: string;
  lat?: number;
  lng?: number;
  features?: string[];
  images?: string[];
}

export interface ListPropertiesParams {
  search?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  priceMin?: number;
  priceMax?: number;
  cursor?: string;
  take?: number;
}

export interface LeadPropertyLink {
  id: string;
  notes: string | null;
  createdAt: string;
  property: Property;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type CalendarEventType   = 'MEETING' | 'CALL' | 'TASK';
export type CalendarEventStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface CalendarEvent {
  id:          string;
  title:       string;
  description: string | null;
  startAt:     string;
  endAt:       string;
  type:        CalendarEventType;
  status:      CalendarEventStatus;
  createdAt:   string;
  updatedAt:   string;
  user:        { id: string; name: string };
  lead:        { id: string; firstName: string; lastName: string; phone: string } | null;
}

export interface CreateCalendarEventInput {
  title:        string;
  description?: string;
  type:         CalendarEventType;
  startAt:      string;
  endAt:        string;
  leadId?:      string;
  assignedToId?: string;
}

export interface UpdateCalendarEventInput extends Partial<CreateCalendarEventInput> {}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface OverviewReport {
  leads: {
    total:  number;
    new:    number;
    active: number;
    won:    number;
    lost:   number;
    paused: number;
  };
  conversion: {
    leadToOportunidad:        number;
    oportunidadToCalificacion: number;
    calificacionToCierre:     number;
    overallRate:              number;
  };
  revenue: {
    totalWon:    number;
    averageDeal: number;
    pipeline:    number;
  };
  activities: {
    total:    number;
    calls:    number;
    meetings: number;
    emails:   number;
    whatsapp: number;
  };
  avgTimeToClose: number;
}

export interface ByStageItem {
  stage: { id: string; name: string; color: string; order: number } | null;
  count: number;
}

export interface BySourceItem {
  source:     LeadSource;
  count:      number;
  percentage: number;
}

export interface BySellerItem {
  userId:    string;
  name:      string;
  avatarUrl?: string | null;
  leads: {
    assigned: number;
    active:   number;
    won:      number;
    lost:     number;
  };
  activities: {
    total:    number;
    calls:    number;
    meetings: number;
  };
  conversionRate:  number;
  avgTimeToClose:  number;
  revenue:         number;
}

export interface TimelinePoint {
  date:  string;
  count: number;
  won:   number;
  lost:  number;
}

export interface ListReportsParams {
  startDate?: string;
  endDate?:   string;
}

export interface TimelineParams extends ListReportsParams {
  groupBy?: 'day' | 'week' | 'month';
}

// ─── Communications ───────────────────────────────────────────────────────────

export type MessageType   = 'WHATSAPP' | 'EMAIL';
export type MessageStatus = 'SENT' | 'FAILED' | 'PENDING';

export interface Template {
  id:        string;
  name:      string;
  type:      MessageType;
  subject:   string | null;
  body:      string;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

export interface TemplatePreview extends Template {
  resolvedBody:    string;
  resolvedSubject: string | null;
}

export interface CreateTemplateInput {
  name:     string;
  type:     MessageType;
  subject?: string;
  body:     string;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {}

export interface ListTemplatesParams {
  type?:            MessageType;
  includeInactive?: boolean;
}

export interface Message {
  id:        string;
  type:      MessageType;
  subject:   string | null;
  body:      string;
  status:    MessageStatus;
  sentAt:    string | null;
  createdAt: string;
  user:      { id: string; name: string };
  template:  { id: string; name: string } | null;
}

export interface SendWhatsAppInput {
  leadId:      string;
  templateId?: string;
  body:        string;
}

export interface SendEmailInput {
  leadId:      string;
  templateId?: string;
  subject:     string;
  body:        string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'LEAD_INACTIVE'
  | 'ACTION_OVERDUE'
  | 'LEAD_UNCONTACTED'
  | 'MEETING_REMINDER';

export interface NotificationLead {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  leadId: string | null;
  lead: NotificationLead | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  data: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export type WebhookProvider = 'FACEBOOK' | 'GOOGLE' | 'OTHER';
export type WebhookStatus = 'PENDING' | 'PROCESSED' | 'FAILED' | 'DUPLICATE';

export interface WebhookEvent {
  id: string;
  provider: WebhookProvider;
  status: WebhookStatus;
  providerEventId: string;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  leadId: string | null;
  lead: { id: string; firstName: string; lastName: string } | null;
}

export interface WebhookEventsResponse {
  data: WebhookEvent[];
  total: number;
}

export interface WebhookConfig {
  facebook: {
    verifyToken: string;
    pageAccessTokenConfigured: boolean;
    appSecretConfigured: boolean;
  };
  google: {
    key: string;
    configured: boolean;
  };
  generic: {
    secret: string;
    configured: boolean;
  };
}

export interface ListWebhookEventsParams {
  provider?: WebhookProvider;
  status?: WebhookStatus;
  limit?: number;
  offset?: number;
}

// ─── Lead Scoring ─────────────────────────────────────────────────────────────

export type LeadTemperature = 'COLD' | 'WARM' | 'HOT';

export interface LeadScore {
  id: string;
  leadId: string;
  score: number;
  temperature: LeadTemperature;
  factors: Record<string, number>;
  reasoning: string;
  recommendation: string;
  urgency: 'ALTA' | 'MEDIA' | 'BAJA';
  positiveSignals: string[];
  negativeSignals: string[];
  geminiAnalysis: string | null;
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoringInsights {
  distribution: { HOT: number; WARM: number; COLD: number };
  topLeads: {
    leadId:      string;
    firstName:   string;
    lastName:    string;
    score:       number;
    temperature: LeadTemperature;
    stage:       { id: string; name: string; color: string } | null;
    assignedTo:  { id: string; name: string; avatarUrl?: string | null } | null;
  }[];
  conversionByTemperature: {
    temperature:    string;
    conversionRate: number | null;
    total:          number;
  }[];
}

// ─── Funnel / Pipeline settings ───────────────────────────────────────────────

export interface ProjectedRevenueStage {
  stageId:     string;
  stageName:   string;
  color:       string;
  probability: number;
  leadCount:   number;
  pipeline:    number;
  projected:   number;
}

export interface ProjectedRevenueReport {
  stages:         ProjectedRevenueStage[];
  totalPipeline:  number;
  totalProjected: number;
}

export interface LostByReasonItem {
  lossReasonId:   string | null;
  lossReasonName: string;
  count:          number;
  percentage:     number;
}

export interface VelocityStage {
  stageId:    string;
  stageName:  string;
  color:      string;
  avgDays:    number;
  sampleSize: number;
}

// Error shape returned by the NestJS API
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
