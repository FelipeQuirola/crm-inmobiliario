// ============================================================================
// ENUMS
// ============================================================================

export enum Role {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
}

export enum LeadStatus {
  LEAD = 'LEAD',
  OPORTUNIDAD = 'OPORTUNIDAD',
  CALIFICACION = 'CALIFICACION',
  CIERRE = 'CIERRE',
}

export enum LeadSource {
  MANUAL = 'MANUAL',
  FACEBOOK = 'FACEBOOK',
  GOOGLE_ADS = 'GOOGLE_ADS',
  SITIO_WEB = 'SITIO_WEB',
  REFERIDO = 'REFERIDO',
  OTRO = 'OTRO',
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// TENANT TYPES
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// LEAD TYPES
// ============================================================================

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  budget: number | null;
  propertyType: string | null;
  desiredLocation: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  isActive: boolean;
  lastContactedAt: string | null;
  assignedToId: string | null;
  pipelineStageId: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  isDefault: boolean;
  tenantId: string;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
