import { api } from '@/lib/api';
import type {
  CalendarEvent,
  CalendarEventStatus,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@/types';

export interface ListCalendarEventsParams {
  startDate:     string;
  endDate:       string;
  assignedToId?: string;
}

export const calendarService = {
  list(params: ListCalendarEventsParams): Promise<CalendarEvent[]> {
    return api.get('/calendar', { params }).then((r) => r.data);
  },

  today(): Promise<CalendarEvent[]> {
    return api.get('/calendar/today').then((r) => r.data);
  },

  create(data: CreateCalendarEventInput): Promise<CalendarEvent> {
    return api.post('/calendar', data).then((r) => r.data);
  },

  update(id: string, data: UpdateCalendarEventInput): Promise<CalendarEvent> {
    return api.patch(`/calendar/${id}`, data).then((r) => r.data);
  },

  changeStatus(id: string, status: CalendarEventStatus): Promise<CalendarEvent> {
    return api.patch(`/calendar/${id}/status`, { status }).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/calendar/${id}`);
  },
};
