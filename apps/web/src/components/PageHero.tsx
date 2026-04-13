interface PageHeroProps {
  imageUrl: string;
  imageAlt: string;
  title: string;
  subtitle: string;
}

export function PageHero({ imageUrl, imageAlt, title, subtitle }: PageHeroProps) {
  return (
    <section style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
      <img
        src={imageUrl}
        alt={imageAlt}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(35,16,59,0.85) 0%, rgba(0,96,49,0.75) 100%)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '64px 24px 0',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 12,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </h1>
        <div
          style={{
            width: 50,
            height: 3,
            background: '#B5C032',
            borderRadius: 2,
            marginBottom: 16,
          }}
        />
        <p
          style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            maxWidth: 520,
            margin: 0,
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          {subtitle}
        </p>
      </div>
    </section>
  );
}