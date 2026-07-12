// ============================================================
//  src/lib/beneficioIconos.jsx
//  Íconos elegibles para el "beneficio adicional" de una cuponera
//  (el que va dentro del círculo amarillo en la home).
//  Curados de Lucide (lucide-react) — set de íconos MIT / gratis.
// ============================================================
import {
  Star, Gift, Zap, Sparkles, TrendingUp, Award, Crown, Ticket,
  Flame, PartyPopper, Heart, Percent, Rocket, ThumbsUp, Coins, BadgePercent,
} from 'lucide-react';

// id estable (se guarda en la DB) → { label, Icon }
export const BENEFICIO_ICONOS = [
  { id: 'star',        label: 'Estrella',     Icon: Star },
  { id: 'gift',        label: 'Regalo',       Icon: Gift },
  { id: 'zap',         label: 'Rayo',         Icon: Zap },
  { id: 'sparkles',    label: 'Destellos',    Icon: Sparkles },
  { id: 'trending',    label: 'En alza',      Icon: TrendingUp },
  { id: 'award',       label: 'Premio',       Icon: Award },
  { id: 'crown',       label: 'Corona',       Icon: Crown },
  { id: 'ticket',      label: 'Ticket',       Icon: Ticket },
  { id: 'flame',       label: 'Llama',        Icon: Flame },
  { id: 'party',       label: 'Fiesta',       Icon: PartyPopper },
  { id: 'heart',       label: 'Corazón',      Icon: Heart },
  { id: 'percent',     label: 'Porcentaje',   Icon: Percent },
  { id: 'rocket',      label: 'Cohete',       Icon: Rocket },
  { id: 'thumbsup',    label: 'Pulgar',       Icon: ThumbsUp },
  { id: 'coins',       label: 'Monedas',      Icon: Coins },
  { id: 'badge',       label: 'Descuento',    Icon: BadgePercent },
];

const POR_ID = Object.fromEntries(BENEFICIO_ICONOS.map(i => [i.id, i.Icon]));

// Devuelve el componente de ícono para un id (Star por defecto).
export function getBeneficioIcon(id) {
  return POR_ID[id] || Star;
}
