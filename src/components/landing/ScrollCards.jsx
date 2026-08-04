import { useEffect, useRef, useState } from 'react';

const A = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  line:        '#E6E3DC',
  font:        "'Inter', system-ui, sans-serif",
};

/**
 * ScrollCards
 * ─────────────────────────────────────────────────────────────
 * Tres tarjetas que animan al entrar en viewport. Cada una
 * se revela con un stagger de ~100ms entre ellas.
 * 
 * Props:
 *   - cards: Array de { title, value, description, icon (opcional) }
 *   - onCardClick: callback cuando clickean una tarjeta
 */
export default function ScrollCards({ cards = [], onCardClick }) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(container);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={containerRef}
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '80px 24px',
        background: 'transparent',
        fontFamily: A.font,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          textAlign: 'center',
          marginBottom: 60,
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 700,
            color: A.ink,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Todo lo que necesitás en Villa Gesell
        </h2>
        <p
          style={{
            fontSize: '18px',
            color: A.ink2,
            marginTop: 16,
            lineHeight: 1.5,
            maxWidth: '600px',
            margin: '16px auto 0',
          }}
        >
          Descubrí nuestros productos diseñados para disfrutar al máximo
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 28,
          maxWidth: '1280px',
          margin: '0 auto',
        }}
      >
        {cards.map((card, idx) => (
          <div
            key={idx}
            ref={(el) => (cardRefs.current[idx] = el)}
            onClick={() => onCardClick?.(card)}
            style={{
              padding: 32,
              borderRadius: 24,
              background: '#fff',
              border: `1px solid ${A.line}`,
              boxShadow: '0 8px 24px rgba(11,16,32,0.08)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isVisible
                ? 'translateY(0) opacity(1)'
                : 'translateY(40px) opacity(0)',
              transitionDelay: isVisible ? `${idx * 100}ms` : '0ms',
              animation: isVisible
                ? `scrollCardsEntry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 100}ms both`
                : 'none',
              ':hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 16px 40px rgba(11,16,32,0.16)',
              },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(11,16,32,0.16)';
            }}
            onMouseLeave={(e) => {
              if (isVisible) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,16,32,0.08)';
              }
            }}
          >
            {card.icon && (
              <div
                style={{
                  fontSize: 48,
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {card.icon}
              </div>
            )}

            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: A.ink2,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                margin: '0 0 12px',
              }}
            >
              {card.title}
            </h3>

            <div
              style={{
                fontSize: 'clamp(28px, 6vw, 42px)',
                fontWeight: 700,
                color: A.primary,
                margin: '12px 0 20px',
                lineHeight: 1.1,
              }}
            >
              {card.value}
            </div>

            <p
              style={{
                fontSize: 15,
                color: A.ink2,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scrollCardsEntry {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 760px) {
          .scroll-cards-container {
            padding: 60px 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*="animation-name"] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
