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
import { useUpdateEvent } from '@/hooks/useCalendar';
import { LeadSearchInput } from '@/components/LeadSearchInput';
import type { CalendarEvent } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    title:       z.string().min(1, 'Título requerido'),
    type:        z.enum(['MEETING', 'CALL', 'TASK']),
    startAt:     z.string().min(1, 'Requerido'),
    endAt:       z.string().min(1, 'Requerido'),
    description: z.string().optional(),
    leadId:      z.string().optional(),
  })
  .refine((d) => !d.startAt || !d.endAt || new Date(d.endAt) >= new Date(d.startAt), {
    message: 'La fecha de fin debe ser igual o posterior al inicio',
    path: ['endAt'],
  });

type FormValues = z.infer<typeof schema>;

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditEventSheetProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  event:        CalendarEvent;
}

export function EditEventSheet({ open, onOpenChange, event }: EditEventSheetProps) {
  const updateEvent = useUpdateEvent();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       event.title,
      type:        event.type,
      startAt:     toDatetimeLocal(event.startAt),
      endAt:       toDatetimeLocal(event.endAt),
      description: event.description ?? '',
      leadId:      event.lead?.id ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title:       event.title,
        type:        event.type,
        startAt:     toDatetimeLocal(event.startAt),
        endAt:       toDatetimeLocal(event.endAt),
        description: event.description ?? '',
        leadId:      event.lead?.id ?? '',
      });
    }
  }, [open, event, form]);

  const onSubmit = async (values: FormValues) => {
    await updateEvent.mutateAsync({
      id: event.id,
      data: {
        title:       values.title,
        type:        values.type,
        startAt:     new Date(values.startAt).toISOString(),
        endAt:       new Date(values.endAt).toISOString(),
        description: values.description || undefined,
        leadId:      values.leadId || undefined,
      },
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Editar evento</SheetTitle>
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
                    <Input {...field} />
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
                    <Textarea rows={2} className="resize-none" {...field} />
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
                initialLead={event.lead ?? null}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateEvent.isPending}>
                {updateEvent.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
