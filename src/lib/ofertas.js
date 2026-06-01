// ============================================================
//  src/lib/ofertas.js
//  Solo dos tipos de oferta: Flash y Normal
// ============================================================

export const OFFER_TYPES = {
  Flash: {
    label:     'FLASH Sale!',
    emoji:     '⚡',
    color:     'bg-red-600',
    textColor: 'text-red-600',
    badgeBg:   'bg-red-600',
    border:    'border-red-200',
    hasTimer:  true,
    hideLabel: false,
  },
  Normal: {
    label:     'Oferta',
    emoji:     '🏷️',
    color:     'bg-blue-600',
    textColor: 'text-blue-600',
    badgeBg:   'bg-blue-600',
    border:    'border-blue-100',
    hasTimer:  false,
    hideLabel: true,  // no muestra etiqueta en la tarjeta
  },
};

export function getOfferConfig(offerType) {
  return OFFER_TYPES[offerType] || OFFER_TYPES.Normal;
}

export function secondsUntil(isoDate) {
  if (!isoDate) return 0;
  return Math.max(0, Math.floor((new Date(isoDate) - new Date()) / 1000));
}

export function formatCountdown(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
