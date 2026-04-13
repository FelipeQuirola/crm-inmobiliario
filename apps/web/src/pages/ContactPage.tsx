import { Helmet } from 'react-helmet-async';
import { ContactForm } from '@/components/ContactForm';
import { PageHero } from '@/components/PageHero';
import { WA_NUM } from '@/api/client';

const CONTACT_INFO = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    label: 'Dirección',
    value: 'Quito, Ecuador',
    href: undefined,
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    label: 'Teléfono / WhatsApp',
    value: '+593 98 619 5044',
    href: `https://wa.me/${WA_NUM}`,
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    label: 'Email',
    value: 'info@homematchinmobiliaria.com',
    href: 'mailto:info@homematchinmobiliaria.com',
  },
];

export function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contacto — HomeMatch Inmobiliaria</title>
        <meta
          name="description"
          content="Contacta a HomeMatch Inmobiliaria. Te ayudamos a encontrar la propiedad ideal en Ecuador."
        />
      </Helmet>

      <PageHero
        imageUrl="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"
        imageAlt="Oficina HomeMatch"
        title="Contáctanos"
        subtitle="Estamos aquí para ayudarte"
      />

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Contact info */}
            <div className="space-y-8 lg:col-span-2">
              <div>
                <h2 className="text-2xl font-bold text-secondary">Información de contacto</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Contáctanos por cualquiera de estos medios y te responderemos a la brevedad.
                </p>
              </div>

              <div className="space-y-4">
                {CONTACT_INFO.map(({ icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-secondary hover:text-primary"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-secondary">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map placeholder */}
              <div className="overflow-hidden rounded-2xl bg-gray-200">
                <div className="flex h-52 flex-col items-center justify-center gap-2 text-gray-500">
                  <svg
                    className="h-10 w-10 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Quito, Ecuador</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
                <ContactForm
                  title="Envíanos un mensaje"
                  subtitle="Completa el formulario y te contactamos lo antes posible."
                  showPropertyInterest
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
