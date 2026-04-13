import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { useCreateEvent } from '@/hooks/useCalendar';
import { useTenantUsers } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/auth.store';
import { LeadSearchInput } from '@/components/LeadSearchInput';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    title:        z.string().min(1, 'Título requerido'),
    type:         z.enum(['MEETING', 'CALL', 'TASK']),
    startAt:      z.string().min(1, 'Fecha de inicio requerida'),
    endAt:        z.string().min(1, 'Fecha de fin requerida'),
    description:  z.string().optional(),
    leadId:       z.string().optional(),
    assignedToId: z.string().optional(),
  })
  .refine((d) => !d.startAt || !d.endAt || new Date(d.endAt) >= new Date(d.startAt), {
    message: 'La fecha de fin debe ser igual o posterior al inicio',
    path: ['endAt'],
  });

type FormValues = z.infer<typeof schema>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStart(date?: Date): string {
  const d = date ?? new Date();
  d.setMinutes(0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}

function defaultEnd(startStr: string): string {
  if (!startStr) return '';
  const d = new Date(startStr);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocal(d.toISOString());
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateEventSheetProps {
  open:          boolean;
  onOpenChange:  (v: boolean) => void;
  initialDate?:  Date;
  initialLeadId?: string;
}

export function CreateEventSheet({
  open,
  onOpenChange,
  initialDate,
  initialLeadId,
}: CreateEventSheetProps) {
  const createEvent = useCreateEvent();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';

  const { data: tenantUsers } = useTenantUsers();
  const activeUsers = (tenantUsers ?? []).filter((u) => u.isActive);

  const start = defaultStart(initialDate);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:        '',
      type:         'MEETING',
      startAt:      start,
      endAt:        defaultEnd(start),
      description:  '',
      leadId:       initialLeadId ?? '',
      assignedToId: '',
    },
  });

  useEffect(() => {
    if (open) {
      const s = defaultStart(initialDate);
      form.reset({
        title:        '',
        type:         'MEETING',
        startAt:      s,
        endAt:        defaultEnd(s),
        description:  '',
        leadId:       initialLeadId ?? '',
        assignedToId: '',
      });
    }
  }, [open, initialDate, initialLeadId, form]);

  const onSubmit = async (values: FormValues) => {
    await createEvent.mutateAsync({
      title:        values.title,
      type:         values.type,
      startAt:      new Date(values.startAt).toISOString(),
      endAt:        new Date(values.endAt).toISOString(),
      description:  values.description || undefined,
      leadId:       values.leadId || undefined,
      assignedToId: isAdmin ? (values.assignedToId || undefined) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Nuevo evento</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Reunión con cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="MEETING">Reunión</SelectItem>
                      <SelectItem value="CALL">Llamada</SelectItem>
                      <SelectItem value="TASK">Tarea</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" placeholder="Notas del evento..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lead search */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Lead asociado</p>
              <LeadSearchInput
                value={form.watch('leadId') ?? ''}
                onChange={(id) => form.setValue('leadId', id)}
              />
            </div>

            {/* Assignee — ADMIN only */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignado a</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Yo mismo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Yo mismo</SelectItem>
                        {activeUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending ? 'Guardando...' : 'Crear evento'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
