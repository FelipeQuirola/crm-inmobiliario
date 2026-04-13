import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, SLUG } from '@/api/client';
import type { AxiosError } from 'axios';

interface ContactFormProps {
  propertyId?: string;
  title?: string;
  subtitle?: string;
  showPropertyInterest?: boolean;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  propertyInterest: string;
  message: string;
}

const INITIAL: FormState = {
  firstName: '', lastName: '', phone: '', email: '',
  propertyInterest: '', message: '',
};

export function ContactForm({
  propertyId,
  title = 'Envíanos un mensaje',
  subtitle,
  showPropertyInterest = false,
}: ContactFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/public/contact', {
        ...form,
        slug: SLUG,
        propertyId: propertyId ?? undefined,
      }),
    onSuccess: () => setForm(INITIAL),
  });

  if (mutation.isSuccess) {
    return (
      <div className="animate-fade-in rounded-2xl bg-primary/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-secondary">¡Mensaje enviado con éxito!</h3>
        <p className="mt-2 text-sm text-gray-600">
          Uno de nuestros asesores se comunicará contigo pronto.
        </p>
        <button
          onClick={() => mutation.reset()}
          className="mt-5 rounded-lg border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  const errMsg = mutation.error
    ? ((mutation.error as AxiosError<{ message: string }>).response?.data?.message ?? 'Error al enviar. Intenta de nuevo.')
    : null;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="space-y-4"
    >
      {title && <h2 className="text-xl font-bold text-secondary">{title}</h2>}
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

      {errMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errMsg}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre *">
          <input
            type="text" value={form.firstName} onChange={set('firstName')}
            required placeholder="Juan"
            className={inputCls}
          />
        </Field>
        <Field label="Apellido *">
          <input
            type="text" value={form.lastName} onChange={set('lastName')}
            required placeholder="Pérez"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Teléfono *">
        <input
          type="tel" value={form.phone} onChange={set('phone')}
          required placeholder="+593 99 000 0000"
          className={inputCls}
        />
      </Field>

      <Field label="Email">
        <input
          type="email" value={form.email} onChange={set('email')}
          placeholder="juan@email.com"
          className={inputCls}
        />
      </Field>

      {showPropertyInterest && (
        <Field label="¿Qué tipo de propiedad buscas?">
          <select value={form.propertyInterest} onChange={set('propertyInterest')} className={inputCls}>
            <option value="">Selecciona una opción</option>
            <option value="Casa">Casa</option>
            <option value="Departamento">Departamento</option>
            <option value="Terreno">Terreno</option>
            <option value="Local comercial">Local comercial</option>
            <option value="Oficina">Oficina</option>
            <option value="Bodega">Bodega</option>
          </select>
        </Field>
      )}

      <Field label="Mensaje">
        <textarea
          rows={4} value={form.message} onChange={set('message')}
          placeholder="Cuéntanos qué buscas..."
          className={`${inputCls} resize-none`}
        />
      </Field>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 disabled:opacity-60"
      >
        {mutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </span>
        ) : 'Enviar consulta'}
      </button>

      <p className="text-center text-xs text-gray-400">
        Al enviar aceptas que nos comuniquemos contigo para atender tu consulta.
      </p>
    </form>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-secondary outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  );
}
