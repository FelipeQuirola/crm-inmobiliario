import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy, Check, ExternalLink, Globe, Zap,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useWebhookConfig, useWebhookEvents } from '@/hooks/useWebhooks';
import type { WebhookProvider, WebhookStatus, ListWebhookEventsParams } from '@/types';

// ─── Base API URL (derived from VITE_API_URL) ─────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';
const WEBHOOK_BASE = `${API_BASE}/webhooks`;

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={() => void handleCopy()}
      className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      title="Copiar"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ─── Code snippet row ─────────────────────────────────────────────────────────

function CodeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="flex items-center gap-2 rounded-md bg-gray-50 border px-3 py-2">
        <code className="flex-1 text-xs text-gray-800 break-all font-mono">{value}</code>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<WebhookStatus, string> = {
  PROCESSED: 'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-700',
  DUPLICATE: 'bg-gray-100 text-gray-600',
  PENDING:   'bg-amber-100 text-amber-700',
};

const PROVIDER_STYLES: Record<WebhookProvider, string> = {
  FACEBOOK: 'bg-blue-100 text-blue-700',
  GOOGLE:   'bg-orange-100 text-orange-700',
  OTHER:    'bg-purple-100 text-purple-700',
};

function statusLabel(s: WebhookStatus) {
  return { PROCESSED: 'Procesado', FAILED: 'Fallido', DUPLICATE: 'Duplicado', PENDING: 'Pendiente' }[s];
}

// ─── Payload modal ────────────────────────────────────────────────────────────

function PayloadModal({ payload, onClose }: { payload: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Payload JSON</h3>
          <div className="flex gap-2">
            <CopyButton text={payload} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">&times;</button>
          </div>
        </div>
        <pre className="overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-300 font-mono">
          {payload}
        </pre>
      </div>
    </div>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 space-y-1.5 pl-1">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-600">
          <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
            {i + 1}
          </span>
          {s}
        </li>
      ))}
    </ol>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

type EventFilter = { provider?: WebhookProvider; status?: WebhookStatus };

export function IntegrationsPage() {
  const navigate = useNavigate();
  const { data: config } = useWebhookConfig();
  const [eventFilter, setEventFilter] = useState<EventFilter>({});
  const [offset, setOffset] = useState(0);
  const [viewPayload, setViewPayload] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>('facebook');

  const params: ListWebhookEventsParams = { ...eventFilter, limit: PAGE_SIZE, offset };
  const { data: events } = useWebhookEvents(params);

  const totalEvents = events?.total ?? 0;
  const totalPages = Math.ceil(totalEvents / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const genericExample = JSON.stringify(
    { firstName: 'Juan', lastName: 'Pérez', phone: '0991234567', email: 'juan@email.com', notes: 'Interesado en casa en Cumbayá' },
    null, 2,
  );

  const toggleCard = (name: string) =>
    setExpandedCard((prev) => (prev === name ? null : name));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conecta fuentes externas para recibir leads automáticamente.
        </p>
      </div>

      {/* ── Webhooks de entrada ──────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-700">Webhooks de entrada</h2>
        <div className="space-y-3">

          {/* Facebook */}
          <Card>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleCard('facebook')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Facebook Lead Ads</CardTitle>
                    <p className="text-xs text-gray-500">Recibe leads de formularios nativos de Facebook</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {config?.facebook.pageAccessTokenConfigured ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" /> Token configurado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <XCircle className="h-3.5 w-3.5" /> Token no configurado
                    </span>
                  )}
                  {expandedCard === 'facebook' ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedCard === 'facebook' && (
              <CardContent className="border-t pt-4 space-y-4">
                <CodeRow
                  label="URL de verificación (GET)"
                  value={`${WEBHOOK_BASE}/facebook`}
                />
                <CodeRow
                  label="URL para recibir leads (POST)"
                  value={`${WEBHOOK_BASE}/facebook`}
                />
                {config && (
                  <CodeRow
                    label="Token de verificación"
                    value={config.facebook.verifyToken || '(no configurado)'}
                  />
                )}
                <Steps items={[
                  'Ve a Facebook Business Manager → Configuración → Webhooks.',
                  'Crea un nuevo webhook tipo "Página".',
                  'Pega la URL de arriba y el token de verificación.',
                  'Suscríbete al campo "leadgen".',
                  'Configura FACEBOOK_PAGE_ACCESS_TOKEN en el .env del servidor.',
                  'Vincula el page_id en la tabla facebook_page_configs.',
                ]} />
              </CardContent>
            )}
          </Card>

          {/* Google */}
          <Card>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleCard('google')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Google Ads — Lead Form</CardTitle>
                    <p className="text-xs text-gray-500">Recibe leads de formularios de clientes potenciales</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {config?.google.configured ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" /> Configurado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <XCircle className="h-3.5 w-3.5" /> No configurado
                    </span>
                  )}
                  {expandedCard === 'google' ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedCard === 'google' && (
              <CardContent className="border-t pt-4 space-y-4">
                <CodeRow
                  label="URL del webhook (POST)"
                  value={`${WEBHOOK_BASE}/google?slug=homematch`}
                />
                {config && (
                  <CodeRow
                    label="Clave de verificación (google_key)"
                    value={config.google.key || '(no configurado)'}
                  />
                )}
                <Steps items={[
                  'En Google Ads ve a Herramientas → Activos → Formularios de clientes potenciales.',
                  'Edita el formulario activo y ve a la sección "Webhook".',
                  'Pega la URL y la clave de verificación.',
                  'Guarda y activa el formulario.',
                ]} />
              </CardContent>
            )}
          </Card>

          {/* Generic */}
          <Card>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleCard('generic')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Webhook Genérico</CardTitle>
                    <p className="text-xs text-gray-500">Conecta cualquier formulario externo vía HTTP POST</p>
                  </div>
                </div>
                {expandedCard === 'generic' ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </CardHeader>
            {expandedCard === 'generic' && (
              <CardContent className="border-t pt-4 space-y-4">
                <CodeRow
                  label="URL (POST)"
                  value={`${WEBHOOK_BASE}/generic?slug=homematch`}
                />
                <CodeRow
                  label="Header requerido"
                  value={`X-Webhook-Secret: ${config?.generic.secret || 'homematch_generic_secret_2024'}`}
                />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">Body JSON de ejemplo</p>
                  <div className="relative">
                    <pre className="rounded-md bg-gray-900 p-3 text-xs text-green-300 font-mono overflow-auto">
                      {genericExample}
                    </pre>
                    <div className="absolute right-2 top-2">
                      <CopyButton text={genericExample} />
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">
                    <strong>Prueba local con PowerShell:</strong>
                  </p>
                  <code className="mt-1 block text-xs text-amber-800 font-mono whitespace-pre-wrap">
                    {`Invoke-RestMethod -Method POST \`\n  -Uri "${WEBHOOK_BASE}/generic?slug=homematch" \`\n  -Headers @{"X-Webhook-Secret"="${config?.generic.secret || 'homematch_generic_secret_2024'}"} \`\n  -ContentType "application/json" \`\n  -Body '{"firstName":"Test","lastName":"Webhook","phone":"0991111111"}'`}
                  </code>
                </div>
                <Steps items={[
                  'Haz un POST a la URL con el header X-Webhook-Secret.',
                  'El body debe incluir firstName, lastName y phone.',
                  'El lead se crea inmediatamente y se asigna al stage inicial.',
                  'Útil para Zapier, Make, o cualquier formulario personalizado.',
                ]} />
              </CardContent>
            )}
          </Card>
        </div>
      </section>

      {/* ── Historial de webhooks ─────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">
            Historial de eventos
            {totalEvents > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({totalEvents})</span>
            )}
          </h2>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              className="rounded-md border bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none"
              value={eventFilter.provider ?? ''}
              onChange={(e) => {
                setEventFilter((f) => ({ ...f, provider: e.target.value as WebhookProvider || undefined }));
                setOffset(0);
              }}
            >
              <option value="">Todos los orígenes</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="GOOGLE">Google</option>
              <option value="OTHER">Otro</option>
            </select>
            <select
              className="rounded-md border bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none"
              value={eventFilter.status ?? ''}
              onChange={(e) => {
                setEventFilter((f) => ({ ...f, status: e.target.value as WebhookStatus || undefined }));
                setOffset(0);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="PROCESSED">Procesado</option>
              <option value="FAILED">Fallido</option>
              <option value="DUPLICATE">Duplicado</option>
              <option value="PENDING">Pendiente</option>
            </select>
          </div>
        </div>

        {!events || events.data.length === 0 ? (
          <div className="rounded-xl border bg-white py-16 text-center text-gray-400">
            <Zap className="mx-auto h-10 w-10 opacity-20 mb-3" />
            <p className="text-sm">No hay eventos de webhook todavía.</p>
            <p className="text-xs mt-1">Los leads recibidos por webhook aparecerán aquí.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Origen</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Lead creado</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-right font-medium">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.data.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', PROVIDER_STYLES[ev.provider])}>
                          {ev.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_STYLES[ev.status])}>
                          {statusLabel(ev.status)}
                        </span>
                        {ev.errorMessage && (
                          <p className="mt-0.5 text-[10px] text-red-500 truncate max-w-[200px]" title={ev.errorMessage}>
                            {ev.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ev.lead ? (
                          <button
                            onClick={() => navigate(`/leads/${ev.leadId!}`)}
                            className="flex items-center gap-1 text-indigo-600 hover:underline"
                          >
                            {ev.lead.firstName} {ev.lead.lastName}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(ev.createdAt).toLocaleString('es-EC', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setViewPayload(JSON.stringify(ev, null, 2))}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Página {currentPage} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= totalEvents}
                    onClick={() => setOffset(offset + PAGE_SIZE)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Payload modal */}
      {viewPayload && (
        <PayloadModal payload={viewPayload} onClose={() => setViewPayload(null)} />
      )}
    </div>
  );
}
