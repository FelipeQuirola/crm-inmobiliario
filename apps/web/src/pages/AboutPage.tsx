import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageHero } from '@/components/PageHero';
import { SectionTitle } from '@/components/SectionTitle';

// ── SVG icon atoms ────────────────────────────────────────────────────────────

function IconTarget() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1m18 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      <circle cx="12" cy="12" r="7" strokeWidth={1.5} />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function IconBulb() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CARDS = [
  {
    title: 'Nuestra Misión',
    icon: <IconTarget />,
    text: 'Prestar servicios y asesoramiento inmobiliario a cualquier nivel. Buscando la plena satisfacción de nuestro cliente interno y externo, potenciando los recursos humanos y tecnológicos. Brindando seguridad, confiabilidad en nuestro servicio comprometido en obtener la mayor rentabilidad a través del trato justo entre los clientes y la inmobiliaria.',
  },
  {
    title: 'Visión',
    icon: <IconEye />,
    text: 'Ser reconocida a nivel nacional por su comunicación eficiente y oportuna brindando un servicio personalizado, integral en renovación constante de acuerdo a la demanda y oferta. Mejorando la participación en el mercado utilizando medios tecnológicos al alcance de todos nuestros usuarios.',
  },
  {
    title: 'Política de Calidad',
    icon: <IconShield />,
    text: 'Comprometidos a garantizar un servicio de calidad al ofertar propiedades regularizadas, cuidando las finanzas del ofertante y demandante asegurando el éxito de la inversión con precios reales.',
  },
];

const VALUES = [
  { label: 'Confianza',      icon: <IconShield /> },
  { label: 'Seguridad',      icon: <IconLock /> },
  { label: 'Transparencia',  icon: <IconEye /> },
  { label: 'Excelencia',     icon: <IconStar /> },
  { label: 'Compromiso',     icon: <IconHeart /> },
  { label: 'Innovación',     icon: <IconBulb /> },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Nosotros — HomeMatch Inmobiliaria</title>
        <meta
          name="description"
          content="Conoce a HomeMatch, empresa inmobiliaria comprometida con la seguridad y transparencia en Quito, Ecuador."
        />
      </Helmet>

      <PageHero
        imageUrl="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=870&auto=format&fit=crop"
        imageAlt="Equipo HomeMatch"
        title="Sobre Nosotros"
        subtitle="Conoce quiénes somos y qué nos mueve"
      />

      {/* ── Quiénes somos — 2 columns ─────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Text */}
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                Sobre nosotros
              </span>
              <h2 className="mt-4 text-3xl font-bold text-secondary sm:text-4xl">
                Quiénes Somos
              </h2>
              <div className="mt-3 h-1 w-12 rounded-full bg-accent" />
              <p className="mt-6 text-base leading-relaxed text-gray-600">
                HomeMatch es una empresa que nace en la Ciudad de Quito con el propósito de
                erradicar la informalidad e inseguridad de las transacciones inmobiliarias,
                actuando de manera eficiente y eficaz cumpliendo con la normativa impuesta en
                el país. Garantizando seguridad y éxito en las necesidades del cliente.
                Trabajando con un equipo comprometido, capacitado y con experiencia.
              </p>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Desde nuestra fundación hemos acompañado a cientos de familias y empresas en
                la adquisición, venta y arrendamiento de propiedades en todo el Ecuador,
                siempre bajo los más altos estándares de transparencia y profesionalismo.
              </p>
            </div>

            {/* Experience card */}
            <div className="flex items-center justify-center">
              <div
                className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #006031 0%, #23103B 100%)' }}
              >
                <div className="p-10 text-center">
                  <p className="text-7xl font-extrabold text-white leading-none">10+</p>
                  <p className="mt-3 text-xl font-semibold text-white/80">
                    años de experiencia
                  </p>
                  <div className="mx-auto mt-4 h-0.5 w-16 rounded-full bg-accent/60" />
                  <p className="mt-4 text-sm text-white/60">
                    Construyendo confianza en el mercado inmobiliario ecuatoriano
                  </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Misión / Visión / Política — 3 cards ──────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="Nuestra identidad"
            title="Misión, Visión y Calidad"
            subtitle="Los pilares que sostienen cada decisión que tomamos"
          />

          <div className="grid gap-6 sm:grid-cols-3">
            {CARDS.map(({ title, icon, text }) => (
              <div
                key={title}
                className="rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
                style={{ borderTop: '4px solid #B5C032' }}
              >
                <div className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {icon}
                  </div>
                  <h3
                    className="mt-5 text-lg font-bold"
                    style={{ color: '#23103B' }}
                  >
                    {title}
                  </h3>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: '#374151' }}
                  >
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="Lo que nos define"
            title="Nuestros Valores"
            subtitle="Los principios que guían cada uno de nuestros actos"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {VALUES.map(({ label, icon }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 p-6 text-center transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {icon}
                </div>
                <span className="text-sm font-semibold text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section
        className="py-16 text-center"
        style={{ background: 'linear-gradient(135deg, #23103B 0%, #006031 100%)' }}
      >
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold text-white">
            ¿Listo para trabajar con nosotros?
          </h2>
          <p className="mt-3 text-white/80">
            Contáctanos y comienza tu experiencia HomeMatch hoy mismo.
          </p>
          <Link
            to="/contacto"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-lg transition-all hover:shadow-xl"
          >
            Contáctanos
          </Link>
        </div>
      </section>
    </>
  );
}
