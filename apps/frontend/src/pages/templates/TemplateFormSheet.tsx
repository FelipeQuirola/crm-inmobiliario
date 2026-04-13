import { useEffect, useRef } from 'react';
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
import { useCreateTemplate, useUpdateTemplate } from '@/hooks/useTemplates';
import { TEMPLATE_VARIABLES } from '@/lib/resolve-template';
import type { Template } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name:    z.string().min(1, 'Nombre requerido'),
  type:    z.enum(['WHATSAPP', 'EMAIL']),
  subject: z.string().optional(),
  body:    z.string().min(1, 'Contenido requerido'),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TemplateFormSheetProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  template?:    Template;  // if set → edit mode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateFormSheet({ open, onOpenChange, template }: TemplateFormSheetProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:    template?.name    ?? '',
      type:    template?.type    ?? 'WHATSAPP',
      subject: template?.subject ?? '',
      body:    template?.body    ?? '',
    },
  });

  const watchedType = form.watch('type');

  useEffect(() => {
    if (open) {
      form.reset({
        name:    template?.name    ?? '',
        type:    template?.type    ?? 'WHATSAPP',
        subject: template?.subject ?? '',
        body:    template?.body    ?? '',
      });
    }
  }, [open, template, form]);

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end   = textarea.selectionEnd   ?? 0;
    const current = form.getValues('body');
    const newBody = current.slice(0, start) + variable + current.slice(end);

    form.setValue('body', newBody, { shouldValidate: true });

    // Restore cursor after the inserted variable
    requestAnimationFrame(() => {
      textarea.selectionStart = start + variable.length;
      textarea.selectionEnd   = start + variable.length;
      textarea.focus();
    });
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name:    values.name,
      type:    values.type,
      subject: values.type === 'EMAIL' ? (values.subject || undefined) : undefined,
      body:    values.body,
    };

    if (template) {
      await updateTemplate.mutateAsync({ id: template.id, data: payload });
    } else {
      await createTemplate.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>{template ? 'Editar plantilla' : 'Nueva plantilla'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Seguimiento inicial" {...field} />
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
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedType === 'EMAIL' && (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asunto</FormLabel>
                    <FormControl>
                      <Input placeholder="Información sobre propiedad de tu interés" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={8}
                      className="resize-none font-mono text-sm"
                      placeholder="Hola {{nombre}}, te escribimos de..."
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variable chips */}
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Variables disponibles — haz clic para insertar en el cursor:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map(({ variable, label }) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="rounded-full border border-gray-300 bg-white px-2 py-0.5 font-mono text-xs text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                  >
                    {variable}
                    <span className="ml-1 text-gray-400 font-sans not-italic">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : template ? 'Guardar cambios' : 'Crear plantilla'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
