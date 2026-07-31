// ============================================================
//  src/components/ComprarTokensModal.jsx
// ============================================================

import React, { useState } from 'react';
import { X, Zap, CreditCard, Smartphone, Building2, Banknote } from 'lucide-react';
import { TOKEN_PACKS, calcularPrecio, registrarCompra, CREDITO_PRECIO } from '../lib/cobros';

const FORMAS_PAGO = [
  { id: 'mercadopago',  label: 'MercadoPago',       icon: <Smartphone size={18} />,  desc: 'Pagá con tu cuenta MP',           descuento: 0 },
  { id: 'tarjeta',      label: 'Tarjeta',            icon: <CreditCard size={18} />,  desc: 'Crédito o débito',                 descuento: 0 },
  { id: 'transferencia',label: 'Transferencia',      icon: <Building2 size={18} />,   desc: 'CBU: 0000-0000000-00',             descuento: 0 },
  { id: 'efectivo',     label: 'Efectivo (-15%)',    icon: <Banknote size={18} />,    desc: 'Mercedes Sosa 259, Mar de las Pampas', descuento: 15 },
];

export default function ComprarTokensModal({ negocioId, saldoActual, onClose, onCompraExitosa }) {
  const [packSeleccionado, setPackSeleccionado] = useState(0);
  const [formaPago, setFormaPago]               = useState('mercadopago');
  const [loading, setLoading]                   = useState(false);
  const [exito, setExito]                       = useState(false);

  const pack  = TOKEN_PACKS[packSeleccionado];
  const fpago = FORMAS_PAGO.find(f => f.id === formaPago);

  // Descuento combinado: pack + efectivo
  const descuentoTotal = pack.descuento + (fpago?.descuento || 0);
  const precios = calcularPrecio(pack.cantidad, descuentoTotal);

  async function comprar() {
    setLoading(true);
    const { error } = await registrarCompra({
      negocioId,
      cantidad:     pack.cantidad,
      descuentoPct: descuentoTotal,
      formaPago,
    });
    setLoading(false);
    if (error) return;
    setExito(true);
    setTimeout(() => onCompraExitosa?.(pack.cantidad), 2000);
  }

  if (exito) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap size={32} className="text-green-600" />
        </div>
        <h2 className="font-black text-slate-900 text-2xl mb-2">
          ¡{pack.cantidad} crédito{pack.cantidad > 1 ? 's' : ''} acreditado{pack.cantidad > 1 ? 's' : ''}!
        </h2>
        <p className="text-slate-500 font-medium text-sm">
          Tu saldo ahora es de {(saldoActual || 0) + pack.cantidad} créditos.
          {formaPago === 'transferencia' && ' Ya podés usarlos — hacenos la transferencia cuando puedas.'}
          {formaPago === 'efectivo' && ' Ya podés usarlos — pasá por Mercedes Sosa 259, Mar de las Pampas a completar el pago.'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Comprar créditos</p>
            <h2 className="text-white font-black text-xl">Saldo actual: {saldoActual || 0} créditos</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={22} /></button>
        </div>

        <div className="p-8 space-y-6">

          {/* Selector de pack */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Elegí tu pack</label>
            <div className="grid grid-cols-3 gap-3">
              {TOKEN_PACKS.map((p, i) => {
                const pr = calcularPrecio(p.cantidad, p.descuento);
                return (
                  <button
                    key={i}
                    onClick={() => setPackSeleccionado(i)}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      packSeleccionado === i ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {p.descuento > 0 && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        -{p.descuento}%
                      </span>
                    )}
                    <p className="font-black text-slate-900 text-lg flex items-center gap-1"><img src="/credito-coin.svg" alt="crédito" style={{width:20,height:20}}/> {p.cantidad}</p>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">{p.desc}</p>
                    <p className="font-black text-blue-600 text-sm mt-2">
                      ${pr.sinIva.toLocaleString('es-AR')}
                    </p>
                    <p className="text-slate-400 text-[10px]">+ IVA</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Forma de pago */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Forma de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGO.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormaPago(f.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    formaPago === f.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 ${formaPago === f.id ? 'text-blue-600' : 'text-slate-400'}`}>
                    {f.icon}
                  </div>
                  <div>
                    <p className={`font-black text-sm ${formaPago === f.id ? 'text-blue-700' : 'text-slate-700'}`}>{f.label}</p>
                    <p className="text-slate-400 text-[10px] font-medium leading-tight">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>{pack.cantidad} crédito{pack.cantidad > 1 ? 's' : ''} × ${CREDITO_PRECIO.toLocaleString('es-AR')}</span>
              <span>${(pack.cantidad * CREDITO_PRECIO).toLocaleString('es-AR')}</span>
            </div>
            {descuentoTotal > 0 && (
              <div className="flex justify-between text-sm font-bold text-green-600">
                <span>Descuento {descuentoTotal}%</span>
                <span>- ${precios.ahorro.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium text-slate-500">
              <span>IVA (21%)</span>
              <span>${precios.iva.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>${precios.total.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={comprar}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-base transition-all cursor-pointer active:scale-[0.98]"
          >
            {loading ? 'Procesando...' : `Comprar ${pack.cantidad} crédito${pack.cantidad > 1 ? 's' : ''} — $${precios.total.toLocaleString('es-AR')}`}
          </button>

          {formaPago === 'efectivo' && (
            <p className="text-center text-slate-400 text-xs font-medium">
              Los créditos se acreditan en el acto. Pasá por la oficina a completar el pago.
            </p>
          )}
          {formaPago === 'transferencia' && (
            <p className="text-center text-slate-400 text-xs font-medium">
              CBU: 0000003100089489894505 · Alias: GESELL.AR · Banco Galicia
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
