import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuthStore } from '@/store/auth.store';
import { TemplateCard } from './TemplateCard';
import { TemplateFormSheet } from './TemplateFormSheet';
import type { MessageType } from '@/types';

type Tab = MessageType;

export function TemplatesPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [activeTab,  setActiveTab]  = useState<Tab>('WHATSAPP');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: templates, isLoading } = useTemplates({ type: activeTab });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de mensajes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plantillas reutilizables para WhatsApp y Email
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva plantilla
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border bg-white p-1 w-fit gap-0.5">
        {(['WHATSAPP', 'EMAIL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-white'
                : 'text-muted-foreground hover:bg-gray-100'
            }`}
          >
            {tab === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-white">
          <FileText className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-muted-foreground">
            No hay plantillas de {activeTab === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
          </p>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              Crear la primera
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}

      <TemplateFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
