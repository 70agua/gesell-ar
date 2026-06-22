// ============================================================
//  src/components/ComprarTokensScreen.jsx
//  Pantalla step-by-step de compra de créditos dentro del panel
// ============================================================

import React, { useState } from 'react';
import { ArrowLeft, Check, CreditCard, Smartphone, Building2, Banknote, Zap, Crown } from 'lucide-react';
import { calcularPrecio, registrarCompra, CREDITO_PRECIO } from '../lib/cobros';
import { CoinSVG } from './Token';

const PACKS = [
  { cantidad: 1,  descuento: 0,  label: '1 token',     sublabel: 'Una oferta' },
  { cantidad: 3,  descuento: 0,  label: '3 tokens',    sublabel: 'Tres ofertas' },
  { cantidad: 5,  descuento: 15, label: '5 tokens',    sublabel: '15% de descuento', destacado: true },
  { cantidad: 10, descuento: 15, label: '10 tokens',   sublabel: '15% de descuento' },
  { cantidad: 20, descuento: 20, label: '20 tokens',   sublabel: '20% de descuento' },
];

const FORMAS_PAGO = [
  { id: 'mercadopago',   label: 'MercadoPago',      icon: <Smartphone size={20} />,  desc: 'Pagá con tu cuenta MP',            descuento: 0 },
  { id: 'tarjeta',       label: 'Tarjeta',           icon: <CreditCard size={20} />,  desc: 'Crédito o débito',                  descuento: 0 },
  { id: 'transferencia', label: 'Transferencia',     icon: <Building2 size={20} />,   desc: 'Alias: GESELL.AR · Banco Galicia',  descuento: 0 },
  { id: 'efectivo',      label: 'Efectivo',          icon: <Banknote size={20} />,    desc: 'Mercedes Sosa 259, Mar de las Pampas · -15%', descuento: 15 },
];

export default function ComprarTokensScreen({ negocioId, saldoActual, onVolver, onCompraExitosa }) {
  const [step, setStep]             = useState(1); // 1=elegir, 2=checkout, 3=éxito
  const [packIdx, setPackIdx]       = useState(2); // default: 5 tokens
  const [formaPago, setFormaPago]   = useState('mercadopago');
  const [loading, setLoading]       = useState(false);

  const pack  = PACKS[packIdx];
  const fpago = FORMAS_PAGO.find(f => f.id === formaPago);
  const descuentoTotal = pack.descuento + (fpago?.descuento || 0);
  const precios = calcularPrecio(pack.cantidad, descuentoTotal);

  async function confirmarCompra() {
    setLoading(true);
    const { error } = await registrarCompra({
      negocioId,
      cantidad:     pack.cantidad,
      descuentoPct: descuentoTotal,
      formaPago,
    });
    setLoading(false);
    if (!error) setStep(3);
  }

  // ── Step 3: Éxito ──────────────────────────────────────────
  if (step === 3) return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={48} className="text-green-600" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-3">
        {formaPago === 'mercadopago' || formaPago === 'tarjeta'
          ? `¡${pack.cantidad} crédito${pack.cantidad > 1 ? 's' : ''} acreditado${pack.cantidad > 1 ? 's' : ''}!`
          : '¡Compra registrada!'
        }
      </h1>
      <p className="text-slate-500 font-medium mb-2">
        {formaPago === 'transferencia'
          ? 'Realizá la transferencia y te acreditamos los créditos en menos de 24 horas.'
          : formaPago === 'efectivo'
          ? 'Pasá por Mercedes Sosa 259, Mar de las Pampas para completar el pago.'
          : `Tu saldo ahora es de ${saldoActual + pack.cantidad} tokens.`
        }
      </p>
      {(formaPago === 'mercadopago' || formaPago === 'tarjeta') && (
        <p className="text-slate-400 text-sm font-medium mb-8">Ya podés publicar tu oferta.</p>
      )}
      <button
        onClick={() => onCompraExitosa(
          (formaPago === 'mercadopago' || formaPago === 'tarjeta') ? pack.cantidad : 0
        )}
        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl cursor-pointer transition-all"
      >
        {(formaPago === 'mercadopago' || formaPago === 'tarjeta') ? 'Volver a publicar mi oferta' : 'Volver al panel'}
      </button>
    </div>
  );

  // ── Step 2: Checkout ───────────────────────────────────────
  if (step === 2) return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-8 cursor-pointer transition-colors">
        <ArrowLeft size={18} /> Volver a elegir pack
      </button>

      <h1 className="text-2xl font-black text-slate-900 mb-2">Checkout</h1>
      <p className="text-slate-500 font-medium mb-8">{pack.cantidad} token{pack.cantidad > 1 ? 's' : ''} para publicar ofertas</p>

      {/* Forma de pago */}
      <div className="space-y-3 mb-6">
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Forma de pago</label>
        {FORMAS_PAGO.map(f => (
          <button key={f.id} onClick={() => setFormaPago(f.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${formaPago === f.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
          >
            <div className={`shrink-0 ${formaPago === f.id ? 'text-blue-600' : 'text-slate-400'}`}>{f.icon}</div>
            <div className="flex-1">
              <p className={`font-black text-sm ${formaPago === f.id ? 'text-blue-700' : 'text-slate-700'}`}>{f.label}</p>
              <p className="text-slate-400 text-xs font-medium">{f.desc}</p>
            </div>
            {f.descuento > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-0.5 rounded-full shrink-0">-{f.descuento}%</span>
            )}
            {formaPago === f.id && <Check size={18} className="text-blue-600 shrink-0" />}
          </button>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-slate-50 rounded-2xl p-5 space-y-3 mb-6">
        <div className="flex justify-between text-sm text-slate-600 font-medium">
          <span>{pack.cantidad} token{pack.cantidad > 1 ? 's' : ''} × ${CREDITO_PRECIO.toLocaleString('es-AR')}</span>
          <span>${(pack.cantidad * CREDITO_PRECIO).toLocaleString('es-AR')}</span>
        </div>
        {descuentoTotal > 0 && (
          <div className="flex justify-between text-sm font-bold text-green-600">
            <span>Descuento ({descuentoTotal}%)</span>
            <span>− ${precios.ahorro.toLocaleString('es-AR')}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-slate-500 font-medium">
          <span>IVA (21%)</span>
          <span>${precios.iva.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between font-black text-slate-900 text-lg pt-3 border-t border-slate-200">
          <span>Total</span>
          <span>${precios.total.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {formaPago === 'transferencia' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-700 font-medium">
          CBU: 0000003100089489894505 · Alias: GESELL.AR<br/>
          Enviá el comprobante a hola@gesell.ar para acreditar los créditos.
        </div>
      )}

      <button onClick={confirmarCompra} disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl text-base cursor-pointer transition-all"
      >
        {loading ? 'Procesando...' : `Pagar $${precios.total.toLocaleString('es-AR')}`}
      </button>
    </div>
  );

  // ── Step 1: Elegir pack ────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onVolver} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-8 cursor-pointer transition-colors">
        <ArrowLeft size={18} /> Volver a editar oferta
      </button>

      <div className="flex items-center gap-3 mb-2">
        <CoinSVG size={32} />
        <h1 className="text-2xl font-black text-slate-900">Comprá créditos para publicar</h1>
      </div>
      <p className="text-slate-500 font-medium mb-2">Saldo actual: <span className="font-black text-slate-800">{saldoActual} tokens</span></p>
      <p className="text-slate-400 text-sm font-medium mb-8">Cada token te permite publicar 1 oferta. Tu oferta quedará publicada apenas sea aprobada por el equipo de Cuponear.</p>

      {/* Packs */}
      <div className="space-y-3 mb-8">
        {PACKS.map((p, i) => {
          const pr = calcularPrecio(p.cantidad, p.descuento);
          const seleccionado = packIdx === i;
          return (
            <button key={i} onClick={() => setPackIdx(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${seleccionado ? 'border-blue-600 bg-blue-50' : p.destacado ? 'border-amber-300 bg-amber-50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
            >
              {p.destacado && !seleccionado && (
                <span className="absolute -top-2.5 left-4 bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">Más popular</span>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <CoinSVG size={24} />
                <span className="font-black text-slate-900 text-lg">{p.cantidad}</span>
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 text-sm">{p.label}</p>
                <p className={`text-xs font-medium ${p.descuento > 0 ? 'text-green-600' : 'text-slate-400'}`}>{p.sublabel}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-slate-900">${pr.sinIva.toLocaleString('es-AR')}</p>
                <p className="text-slate-400 text-[10px]">+ IVA</p>
              </div>
              {seleccionado && <Check size={18} className="text-blue-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Alternativa: cambiar de plan */}
      <div className="border-t border-slate-100 pt-6 space-y-3">
        <p className="text-slate-500 text-sm font-medium text-center">¿Publicás ofertas seguido?</p>
        <button className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:border-blue-300 text-left cursor-pointer transition-all">
          <Zap size={22} className="text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-blue-800 text-sm">Pasá a PLUS — $220.000/año</p>
            <p className="text-blue-500 text-xs font-medium">Publicaciones ilimitadas sin créditos. Solo pagás al canjear.</p>
          </div>
          <ArrowLeft size={16} className="text-blue-400 rotate-180 shrink-0" />
        </button>
        <button className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-900 hover:bg-black text-left cursor-pointer transition-all">
          <Crown size={22} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-white text-sm">Pasá a BLACK — $350.000/año</p>
            <p className="text-slate-400 text-xs font-medium">Todo PLUS + destacados + difusión + 1 crédito cada 3 canjes.</p>
          </div>
          <ArrowLeft size={16} className="text-slate-500 rotate-180 shrink-0" />
        </button>
      </div>

      <button onClick={() => setStep(2)} disabled={packIdx === null}
        className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-base cursor-pointer transition-all"
      >
        Continuar con {PACKS[packIdx]?.cantidad} token{PACKS[packIdx]?.cantidad > 1 ? 's' : ''} →
      </button>
    </div>
  );
}
