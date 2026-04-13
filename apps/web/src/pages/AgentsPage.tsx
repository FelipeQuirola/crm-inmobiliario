import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAgents } from '@/hooks/useAgents';
import { ContactForm } from '@/components/ContactForm';
import { SectionTitle } from '@/components/SectionTitle';
import { PageHero } from '@/components/PageHero';
import { UserAvatar } from '@/components/UserAvatar';

export function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const [contactAgentId, setContactAgentId] = useState<string | null>(null);

  return (
    <>
      <Helmet>
        <title>Agentes — HomeMatch Inmobiliaria</title>
        <meta
          name="description"
          content="Conoce al equipo de asesores inmobiliarios de HomeMatch en Quito, Ecuador."
        />
      </Helmet>

      <PageHero
        imageUrl="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80"
        imageAlt="Equipo de agentes HomeMatch"
        title="Nuestro Equipo"
        subtitle="Profesionales comprometidos con tu satisfacción"
      />

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="Equipo HomeMatch"
            title="Asesores expertos"
            subtitle="Cada asesor cuenta con capacitación continua y amplio conocimiento del mercado ecuatoriano"
          />

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : !agents?.length ? (
            <p className="py-12 text-center text-gray-400">
              No hay agentes disponibles en este momento.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      name={agent.name}
                      avatarUrl={agent.avatarUrl}
                      size="lg"
                      style={{ borderRadius: 16 }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-secondary">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.role}</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setContactAgentId(contactAgentId === agent.id ? null : agent.id)
                    }
                    className="mt-5 w-full rounded-xl border border-primary py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    {contactAgentId === agent.id ? 'Cerrar' : 'Contactar'}
                  </button>

                  {contactAgentId === agent.id && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <ContactForm title="" subtitle={`Contactar a ${agent.name}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
