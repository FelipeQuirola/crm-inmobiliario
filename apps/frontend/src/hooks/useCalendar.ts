import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService, type ListCalendarEventsParams } from '@/services/calendar.service';
import type {
  CalendarEventStatus,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@/types';

export const CALENDAR_KEY = 'calendar';

// ─── List ─────────────────────────────────────────────────────────────────────

export function useCalendarEvents(params: ListCalendarEventsParams) {
  return useQuery({
    queryKey: [CALENDAR_KEY, params],
    queryFn: () => calendarService.list(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 1000 * 60,
  });
}

// ─── Today ────────────────────────────────────────────────────────────────────

export function useTodayEvents() {
  return useQuery({
    queryKey: [CALENDAR_KEY, 'today'],
    queryFn: () => calendarService.today(),
    staleTime: 1000 * 60,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCalendarEventInput) => calendarService.create(data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [CALENDAR_KEY] });
      if (variables.leadId) {
        void qc.invalidateQueries({ queryKey: ['activities', variables.leadId] });
      }
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCalendarEventInput }) =>
      calendarService.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CALENDAR_KEY] });
    },
  });
}

// ─── Change status ────────────────────────────────────────────────────────────

export function useUpdateEventStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CalendarEventStatus; leadId?: string | null }) =>
      calendarService.changeStatus(id, status),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [CALENDAR_KEY] });
      if (variables.leadId) {
        void qc.invalidateQueries({ queryKey: ['activities', variables.leadId] });
      }
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CALENDAR_KEY] });
    },
  });
}
