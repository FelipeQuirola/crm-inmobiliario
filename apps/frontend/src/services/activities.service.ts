import { api } from '@/lib/api';
import type { Activity, ActivityPage, CreateActivityInput } from '@/types';

export const activitiesService = {
  list: (leadId: string, page = 1, limit = 20) =>
    api
      .get<ActivityPage>(`/leads/${leadId}/activities`, { params: { page, limit } })
      .then((r) => r.data),

  create: (leadId: string, data: CreateActivityInput) =>
    api
      .post<Activity>(`/leads/${leadId}/activities`, data)
      .then((r) => r.data),

  remove: (leadId: string, activityId: string) =>
    api.delete<void>(`/leads/${leadId}/activities/${activityId}`),
};
