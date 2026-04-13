import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LeadSourceBadge, LeadStatusBadge } from './LeadStatusBadge';
import { useCreateLead, useTenantUsers } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/auth.store';
import type { Lead } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  phone: z
    .string()
    .min(7, 'Teléfono muy corto')
    .max(20, 'Teléfono muy largo')
    .regex(/^[+\d\s\-().]+$/, 'Solo dígitos, +, espacios y guiones'),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  source: z
    .enum(['MANUAL', 'WEBSITE', 'FACEBOOK', 'GOOGLE', 'WHATSAPP', 'REFERRAL', 'OTHER'])
    .optional(),
  propertyInterest: z.string().max(1000).optional(),
  budgetRaw: z.string().optional(),
  assignedToId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Source labels ────────────────────────────────────────────────────────────

const SOURCES: { value: string; label: string }[] = [
  { value: 'MANUAL',   label: 'Manual' },
  { value: 'WEBSITE',  label: 'Sitio web' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'GOOGLE',   label: 'Google Ads' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'REFERRAL', label: 'Referido' },
  { value: 'OTHER',    label: 'Otro' },
];

// ─── Duplicate alert ──────────────────────────────────────────────────────────

function DuplicateAlert({
  lead,
  onDismiss,
}: {
  lead: Lead;
  onDismiss: () => void;
}) {
  return (
    <Alert variant="warning" className="mx-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Lead duplicado detectado</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Ya existe un lead con este teléfono o email:
        </p>
        <div className="rounded-md border bg-white p-3 text-sm space-y-1">
          <p className="font-medium">
            {lead.firstName} {lead.lastName}
          </p>
          <p className="text-muted-foreground">{lead.phone}</p>
          {lead.email && <p className="text-muted-foreground">{lead.email}</p>}
          <div className="flex items-center gap-2 pt-1">
            <LeadStatusBadge status={lead.status} />
            <LeadSourceBadge source={lead.source} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 text-xs"
          onClick={onDismiss}
        >
          Entendido
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LeadFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStageId?: string;
}

export function LeadFormSheet({ open, onOpenChange, defaultStageId }: LeadFormSheetProps) {
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const createLead = useCreateLead();
  const { data: users } = useTenantUsers();
  const currentRole = useAuthStore((s) => s.user?.role);
  const activeUsers = users?.filter((u) => u.isActive) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      source: 'MANUAL',
      propertyInterest: '',
      budgetRaw: '',
      assignedToId: '',
    },
  });

  const handleClose = () => {
    form.reset();
    setDuplicateLead(null);
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    setDuplicateLead(null);

    const budget = values.budgetRaw
      ? parseFloat(values.budgetRaw.replace(/,/g, '.'))
      : undefined;

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      ...(values.email ? { email: values.email } : {}),
      ...(values.source ? { source: values.source as Lead['source'] } : {}),
      ...(values.propertyInterest ? { propertyInterest: values.propertyInterest } : {}),
      ...(budget !== undefined && !isNaN(budget) ? { budget } : {}),
      ...(defaultStageId ? { stageId: defaultStageId } : {}),
      ...(values.assignedToId ? { assignedToId: values.assignedToId } : {}),
    };

    try {
      await createLead.mutateAsync(payload);
      handleClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const body = err.response.data as { message: string; lead: Lead };
          setDuplicateLead(body.lead ?? null);
        } else {
          const msg =
            (err.response?.data as { message?: string | string[] })?.message;
          const text = Array.isArray(msg) ? msg[0] : (msg ?? 'Error al crear lead');
          form.setError('root', { message: text });
        }
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nuevo Lead</SheetTitle>
          <SheetDescription>
            Completa los datos del prospecto. Los campos marcados son obligatorios.
          </SheetDescription>
        </SheetHeader>

        {/* Duplicate alert */}
        {duplicateLead && (
          <DuplicateAlert
            lead={duplicateLead}
            onDismiss={() => setDuplicateLead(null)}
          />
        )}

        {/* Root error */}
        {form.formState.errors.root && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Form {...form}>
          <form
            id="lead-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-4 px-6 py-2"
          >
            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Carlos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ramírez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Teléfono */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input placeholder="+593 98 765 4321" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="carlos@email.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Origen */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona origen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Qué busca */}
            <FormField
              control={form.control}
              name="propertyInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Qué busca?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej. Departamento en Polanco, 2 recámaras, hasta $4M"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Presupuesto */}
            <FormField
              control={form.control}
              name="budgetRaw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto (USD)</FormLabel>
                  <FormControl>
                    <Input placeholder="85000" type="text" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asignar a (solo ADMIN ve esta opción) */}
            {currentRole === 'ADMIN' && activeUsers.length > 0 && (
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>

        <SheetFooter>
          <Button variant="outline" onClick={handleClose} disabled={createLead.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="lead-form"
            disabled={createLead.isPending}
          >
            {createLead.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              'Crear lead'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
