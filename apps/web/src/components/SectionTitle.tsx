interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  light?: boolean; // true = use white/accent text (for dark backgrounds)
}

export function SectionTitle({ label, title, subtitle, center = true, light = false }: SectionTitleProps) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      {label && (
        <span className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
          light ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
        }`}>
          {label}
        </span>
      )}
      <h2 className={`text-3xl font-bold sm:text-4xl ${light ? 'text-white' : 'text-secondary'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 ${center ? 'mx-auto max-w-xl' : ''} ${light ? 'text-white/70' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
      {/* Decorative line */}
      <div className={`mt-4 flex gap-1 ${center ? 'justify-center' : ''}`}>
        <span className="h-1 w-10 rounded-full bg-primary" />
        <span className="h-1 w-3 rounded-full bg-accent" />
        <span className="h-1 w-1 rounded-full bg-secondary" />
      </div>
    </div>
  );
}
