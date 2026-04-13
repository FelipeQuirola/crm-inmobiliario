import { api } from '@/lib/api';
import type {
  OverviewReport,
  ByStageItem,
  BySourceItem,
  BySellerItem,
  TimelinePoint,
  ListReportsParams,
  TimelineParams,
  ProjectedRevenueReport,
  LostByReasonItem,
  VelocityStage,
} from '@/types';

export const reportsService = {
  overview: (params?: ListReportsParams) =>
    api.get<OverviewReport>('/reports/overview', { params }),

  byStage: () =>
    api.get<ByStageItem[]>('/reports/by-stage'),

  bySource: () =>
    api.get<BySourceItem[]>('/reports/by-source'),

  bySeller: (params?: ListReportsParams) =>
    api.get<BySellerItem[]>('/reports/by-seller', { params }),

  timeline: (params?: TimelineParams) =>
    api.get<TimelinePoint[]>('/reports/timeline', { params }),

  projectedRevenue: () =>
    api.get<ProjectedRevenueReport>('/reports/projected-revenue').then((r) => r.data),

  lostByReason: () =>
    api.get<LostByReasonItem[]>('/reports/lost-by-reason').then((r) => r.data),

  velocity: () =>
    api.get<VelocityStage[]>('/reports/velocity').then((r) => r.data),
};
