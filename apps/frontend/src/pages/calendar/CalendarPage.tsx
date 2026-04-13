import { useState, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import type { EventDropArg } from '@fullcalendar/core';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import type {
  EventClickArg,
  EventInput,
  DatesSetArg,
} from '@fullcalendar/core';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCalendarEvents, useUpdateEvent } from '@/hooks/useCalendar';
import { useTenantUsers } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/auth.store';
import { EventDetailPopover } from './EventDetailPopover';
import { CreateEventSheet } from './CreateEventSheet';
import type { CalendarEvent, CalendarEventType } from '@/types';

// ─── Event color by type ──────────────────────────────────────────────────────

const TYPE_COLOR: Record<CalendarEventType, string> = {
  MEETING: '#8b5cf6',
  CALL:    '#10b981',
  TASK:    '#3b82f6',
};

// ─── Status opacity ───────────────────────────────────────────────────────────

function eventOpacity(status: string): string {
  if (status === 'COMPLETED') return '0.55';
  if (status === 'CANCELLED') return '0.35';
  return '1';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';
  const { data: tenantUsers } = useTenantUsers();
  const activeUsers = (tenantUsers ?? []).filter((u) => u.isActive);

  const updateEvent = useUpdateEvent();

  // Date range tracked from FullCalendar's datesSet callback
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate:   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
  });

  const [filterUserId, setFilterUserId] = useState<string>('');

  const { data: events = [] } = useCalendarEvents({
    startDate:     dateRange.startDate,
    endDate:       dateRange.endDate,
    assignedToId:  isAdmin && filterUserId ? filterUserId : undefined,
  });

  // Popover state
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<Element | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Create sheet state
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | undefined>();

  // Map API events → FullCalendar EventInput
  const fcEvents: EventInput[] = events.map((ev) => ({
    id:              ev.id,
    title:           ev.title,
    start:           ev.startAt,
    end:             ev.endAt,
    backgroundColor: TYPE_COLOR[ev.type],
    borderColor:     TYPE_COLOR[ev.type],
    opacity:         eventOpacity(ev.status),
    extendedProps:   ev,
  }));

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    setDateRange({
      startDate: info.startStr,
      endDate:   info.endStr,
    });
  }, []);

  const handleEventClick = useCallback((info: EventClickArg) => {
    setPopoverEvent(info.event.extendedProps as CalendarEvent);
    setPopoverAnchor(info.el);
    setPopoverOpen(true);
  }, []);

  const handleDateClick = useCallback((info: DateClickArg) => {
    setCreateDate(info.date);
    setCreateOpen(true);
  }, []);

  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    const ev = info.event.extendedProps as CalendarEvent;
    const delta = info.delta;

    const newStart = new Date(ev.startAt);
    const newEnd   = new Date(ev.endAt);
    newStart.setMilliseconds(newStart.getMilliseconds() + delta.milliseconds);
    newEnd.setMilliseconds(newEnd.getMilliseconds() + delta.milliseconds);
    // FullCalendar delta also has years/months/days
    newStart.setFullYear(newStart.getFullYear() + delta.years);
    newStart.setMonth(newStart.getMonth() + delta.months);
    newStart.setDate(newStart.getDate() + delta.days);
    newEnd.setFullYear(newEnd.getFullYear() + delta.years);
    newEnd.setMonth(newEnd.getMonth() + delta.months);
    newEnd.setDate(newEnd.getDate() + delta.days);

    try {
      await updateEvent.mutateAsync({
        id:   ev.id,
        data: {
          startAt: newStart.toISOString(),
          endAt:   newEnd.toISOString(),
        },
      });
    } catch {
      info.revert();
    }
  }, [updateEvent]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Select
              value={filterUserId || '__all__'}
              onValueChange={(v) => setFilterUserId(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos los vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los vendedores</SelectItem>
                {activeUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => { setCreateDate(undefined); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo evento
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          locale={esLocale}
          initialView={window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth'}
          headerToolbar={window.innerWidth < 768 ? {
            left:   'prev,next',
            center: 'title',
            right:  'listWeek,dayGridMonth',
          } : {
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{
            today:        'Hoy',
            month:        'Mes',
            week:         'Semana',
            day:          'Día',
            list:         'Lista',
          }}
          events={fcEvents}
          editable={true}
          selectable={true}
          dayMaxEvents={3}
          nowIndicator={true}
          height="auto"
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventDisplay="block"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
        />
      </div>

      {/* Event detail popover — rendered as a floating div anchored to clicked element */}
      {popoverOpen && popoverEvent && popoverAnchor && (
        <FloatingPopover
          anchor={popoverAnchor}
          onClose={() => { setPopoverOpen(false); setPopoverEvent(null); }}
        >
          <EventDetailPopover
            event={popoverEvent}
            onClose={() => { setPopoverOpen(false); setPopoverEvent(null); }}
          />
        </FloatingPopover>
      )}

      <CreateEventSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialDate={createDate}
      />
    </div>
  );
}

// ─── Floating popover anchored to an element ──────────────────────────────────

function FloatingPopover({
  anchor,
  children,
  onClose,
}: {
  anchor:   Element;
  children: React.ReactNode;
  onClose:  () => void;
}) {
  const rect = anchor.getBoundingClientRect();
  const scrollY = window.scrollY;
  const top = rect.bottom + scrollY + 8;
  const left = Math.min(rect.left, window.innerWidth - 300);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Popover box */}
      <div
        className="absolute z-50 rounded-xl border bg-white p-4 shadow-xl"
        style={{ top, left, minWidth: 288 }}
      >
        {children}
      </div>
    </>
  );
}
