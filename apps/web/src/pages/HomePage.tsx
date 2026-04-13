import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProperties } from '@/hooks/useProperties';
import { useAgents } from '@/hooks/useAgents';
import { PropertyWebCard } from '@/components/PropertyWebCard';
import { ContactForm } from '@/components/ContactForm';
import { SectionTitle } from '@/components/SectionTitle';
import { UserAvatar } from '@/components/UserAvatar';
import { parseSearchQuery, buildSearchLabel } from '@/lib/searchParser';
import type { PropertyType } from '@/types';

const CITIES = ['Todas', 'Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Loja'];

const WHY_ITEMS = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Seguridad jurídica',
    desc: 'Verificamos la situación legal de cada propiedad antes de presentarla.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'Equipo experto',
    desc: 'Asesores con amplia experiencia en el mercado inmobiliario ecuatoriano.',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: 'Propiedades verificadas',
    desc: 'Cada inmueble pasa por un proceso riguroso de verificación y documentación.',
    color: 'bg-accent/20 text-secondary',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    title: 'Atención personalizada',
    desc: 'Te acompañamos en cada paso, desde la búsqueda hasta la firma del contrato.',
    color: 'bg-primary/10 text-primary',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<PropertyType | ''>('');
  const [searchCity, setSearchCity] = useState('');

  const { data: featuredData, isLoading: loadingFeatured } = useProperties({ take: 3 });
  const { data: agents } = useAgents();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchText) params.set('search', searchText);
    if (searchType) params.set('type', searchType);
    if (searchCity && searchCity !== 'Todas') params.set('city', searchCity);
    navigate(`/propiedades?${params.toString()}`);
  };

  // Real-time search label (client-side parse, no API)
  const parsedQuery = parseSearchQuery(searchText);
  const searchLabel = searchText.trim().length >= 2 ? buildSearchLabel(parsedQuery) : null;

  return (
    <>
      <Helmet>
        <title>HomeMatch Inmobiliaria — Quito, Ecuador</title>
        <meta name="description" content="Encuentra tu propiedad ideal en Ecuador. Casas, departamentos, terrenos y más con HomeMatch Inmobiliaria." />
      </Helmet>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-[#23103B]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#23103B]/90 to-[#006031]/70" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm ring-1 ring-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Quito, Ecuador
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Creando hogares{' '}
            <span className="text-accent">duraderos.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/75">
            Construyendo hogares, construyendo sueños.
            HomeMatch la mejor opción para ti.
          </p>

          {/* Smart search bar */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-3 shadow-2xl shadow-black/30 sm:flex-row"
          >
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="¿Qué estás buscando?"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-xl border-0 bg-gray-50 py-3 pl-9 pr-3 text-sm text-secondary placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as PropertyType | '')}
              className="rounded-xl border-0 bg-gray-50 px-3 py-3 text-sm text-secondary outline-none focus:bg-white focus:ring-2 focus:ring-primary/30 sm:w-40"
            >
              <option value="">Tipo</option>
              <option value="CASA">Casa</option>
              <option value="APARTAMENTO">Departamento</option>
              <option value="TERRENO">Terreno</option>
              <option value="LOCAL">Local Comercial</option>
              <option value="OFICINA">Oficina</option>
              <option value="BODEGA">Bodega</option>
            </select>

            <select
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="rounded-xl border-0 bg-gray-50 px-3 py-3 text-sm text-secondary outline-none focus:bg-white focus:ring-2 focus:ring-primary/30 sm:w-36"
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Buscar
            </button>
          </form>

          {/* Search feedback — detected intent */}
          {searchLabel && (
            <div className="mt-3 text-center">
              <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
                {searchLabel}
              </span>
            </div>
          )}

          {/* Quick type links */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              { label: 'Casas', type: 'CASA' },
              { label: 'Departamentos', type: 'APARTAMENTO' },
              { label: 'Terrenos', type: 'TERRENO' },
            ].map(({ label, type }) => (
              <button
                key={type}
                onClick={() => navigate(`/propiedades?type=${type}`)}
                className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="bg-primary">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-primary/80 md:grid-cols-4">
          {[
            { value: '500+', label: 'Propiedades' },
            { value: '300+', label: 'Clientes felices' },
            { value: '10+',  label: 'Años de experiencia' },
            { value: '24/7', label: 'Atención' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-primary px-8 py-10 text-center">
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="mt-1 text-sm font-medium text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="Disponibles ahora"
            title="Propiedades destacadas"
            subtitle="Las mejores opciones del mercado seleccionadas para ti"
          />

          {loadingFeatured ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : !featuredData?.items.length ? (
            <p className="py-12 text-center text-gray-400">No hay propiedades disponibles por ahora.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredData.items.map((p) => <PropertyWebCard key={p.id} property={p} />)}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/propiedades"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-8 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Ver todas las propiedades
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Us ────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="Nuestra diferencia"
            title="¿Por qué elegirnos?"
            subtitle="Tu confianza y seguridad son nuestra prioridad"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_ITEMS.map(({ icon, title, desc, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-gray-100 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                  {icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-secondary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agents Preview ────────────────────────────────────────────── */}
      {agents && agents.length > 0 && (
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              label="Nuestro equipo"
              title="Nuestros Agentes"
              subtitle="Profesionales comprometidos con encontrar tu propiedad ideal"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.slice(0, 3).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
                >
                  <UserAvatar
                    name={agent.name}
                    avatarUrl={agent.avatarUrl}
                    size="md"
                    style={{ borderRadius: 16, width: 56, height: 56, fontSize: 20 }}
                  />
                  <div>
                    <p className="font-semibold text-secondary">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/agentes" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary">
                Ver todos los agentes →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── About snippet ─────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-[#3a1a60]">
            <div className="grid items-center gap-0 lg:grid-cols-2">
              <div className="p-10 lg:p-14">
                <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
                  Sobre nosotros
                </span>
                <h2 className="mt-4 text-3xl font-bold text-white">
                  Más de 10 años construyendo sueños
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/70">
                  HomeMatch nace en Quito con el propósito de erradicar la informalidad
                  en las transacciones inmobiliarias. Actuamos de manera eficiente y eficaz,
                  garantizando seguridad y éxito en cada negociación.
                </p>
                <Link
                  to="/nosotros"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Conocer más
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div
                className="hidden h-full min-h-64 bg-cover bg-center lg:block"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80')" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact CTA ───────────────────────────────────────────────── */}
      <section id="contacto" className="bg-gradient-to-br from-secondary to-primary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              Contáctanos
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white">
              ¿Listo para encontrar tu propiedad ideal?
            </h2>
            <p className="mt-3 text-white/70">
              Déjanos tus datos y un asesor se pondrá en contacto contigo a la brevedad.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl bg-white p-8 shadow-2xl shadow-secondary/40">
            <ContactForm title="" />
          </div>
        </div>
      </section>
    </>
  );
}
