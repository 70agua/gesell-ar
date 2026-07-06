// ============================================================
//  src/components/OfertaEditorDrawer.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calcularPrecioCupon, CREDITO_TOTAL } from '../lib/cobros';

const TIPOS_ALOJ = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];

export default function OfertaEditorDrawer({ oferta, negocioId, onClose, onSave }) {
  const esNueva = !oferta?.id;

  const [form, setForm] = useState({
    titulo:          oferta?.titulo          || '',
    subtitulo:       oferta?.subtitulo       || '',
    badge:           oferta?.badge           || '',
    descripcion:     oferta?.descripcion     || '',
    imagen_url:      oferta?.imagen_url      || '',
    offer_type:      oferta?.offer_type      || 'Normal',
    ahorro_estimado: oferta?.ahorro_estimado || '',
    fecha_vencimiento: oferta?.fecha_vencimiento ? oferta.fecha_vencimiento.split('T')[0] : '',
  });

  // Alianzas: array de { negocio_id, nombre, beneficio_mejorado }
  const [alianzas, setAlianzas]         = useState([]);
  const [alojamientos, setAlojamientos] = useState([]);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('negocios')
        .select('id, nombre, tipo, localidad')
        .in('tipo', TIPOS_ALOJ)
        .eq('aprobado', true)
        .order('nombre');
      setAlojamientos(data || []);

      if (oferta?.id) {
        const { data: al } = await supabase
          .from('alianzas')
          .select('*, negocios(nombre, localidad)')
          .eq('promocion_id', oferta.id);
        if (al) setAlianzas(al.map(a => ({
          id:                a.id,
          negocio_id:        a.negocio_id,
          nombre:            a.negocios?.nombre,
          localidad:         a.negocios?.localidad,
          beneficio_mejorado: a.descripcion || '',
        })));
      }
    }
    cargar();
  }, [oferta?.id]);

  function agregarAlianza() {
    if (alianzas.length >= 3) return;
    setAlianzas(prev => [...prev, { negocio_id: '', nombre: '', beneficio_mejorado: '' }]);
  }

  function actualizarAlianza(i, key, value) {
    setAlianzas(prev => prev.map((a, idx) => {
      if (idx !== i) return a;
      if (key === 'negocio_id') {
        const aloj = alojamientos.find(a => a.id === value);
        return { ...a, negocio_id: value, nombre: aloj?.nombre || '', localidad: aloj?.localidad || '' };
      }
      return { ...a, [key]: value };
    }));
  }

  function eliminarAlianza(i) {
    setAlianzas(prev => prev.filter((_, idx) => idx !== i));
  }

  async function guardar() {
    if (!form.titulo) return setError('El título es obligatorio');
    if (!(Number(form.ahorro_estimado) > 0)) return setError('Ingresá el ahorro estimado para el usuario (mayor a $0)');
    setSaving(true); setError('');

    const payload = {
      titulo:          form.titulo,
      subtitulo:       form.subtitulo,
      badge:           form.badge,
      descripcion:     form.descripcion,
      imagen_url:      form.imagen_url,
      offer_type:      form.offer_type,
      ahorro_estimado: form.ahorro_estimado ? Number(form.ahorro_estimado) : null,
      fecha_vencimiento: form.fecha_vencimiento ? new Date(form.fecha_vencimiento).toISOString() : null,
      negocio_id:      negocioId,
      activa:          false,
      aprobada:        false,
    };

    let result;
    if (esNueva) {
      const { data, error: err } = await supabase.from('promociones').insert(payload).select().single();
      if (err) { setSaving(false); return setError('Error al crear la oferta'); }
      result = data;
    } else {
      const { data, error: err } = await supabase.from('promociones').update(payload).eq('id', oferta.id).select().single();
      if (err) { setSaving(false); return setError('Error al guardar'); }
      result = data;
    }

    // Guardar alianzas
    if (result?.id) {
      // Borrar las viejas
      await supabase.from('alianzas').delete().eq('promocion_id', result.id);
      // Insertar las nuevas válidas
      const nuevas = alianzas.filter(a => a.negocio_id);
      if (nuevas.length > 0) {
        await supabase.from('alianzas').insert(nuevas.map(a => ({
          promocion_id:  result.id,
          negocio_id:    a.negocio_id,
          tipo:          'potenciada',
          descripcion:   a.beneficio_mejorado,
          aprobada:      true,
        })));
      }
    }

    setSaving(false);
    onSave(result, esNueva);
  }

  // Alojamientos no usados en alianzas
  const alojDisponibles = alojamientos.filter(a => !alianzas.find(al => al.negocio_id === a.id));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-black text-slate-900 text-lg">{esNueva ? 'Nueva oferta' : 'Editar oferta'}</h2>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              {esNueva ? 'Se enviará para aprobación del equipo Cuponear' : 'Los cambios requieren re-aprobación'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-2"><X size={20} /></button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Datos básicos */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">Datos de la oferta</h3>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">Título *</label>
              <input value={form.titulo} onChange={set('titulo')} placeholder="Ej: 2x1 en la mítica tarde de churros."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">Badge</label>
                <input value={form.badge} onChange={set('badge')} placeholder="Ej: -50%, 2x1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">Tipo</label>
                <select value={form.offer_type} onChange={set('offer_type')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="Normal">Normal</option>
                  <option value="Flash">⚡ Flash Sale</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">Subtítulo</label>
              <input value={form.subtitulo} onChange={set('subtitulo')} placeholder="Ej: Solo por este fin de semana"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">Descripción ampliada</label>
              <textarea value={form.descripcion} onChange={set('descripcion')} rows={3}
                placeholder="Describí en detalle qué incluye, condiciones, vigencia, etc."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">URL de imagen</label>
              <input value={form.imagen_url} onChange={set('imagen_url')} placeholder="https://..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {form.imagen_url && (
                <div className="mt-2 aspect-square rounded-xl overflow-hidden max-w-[180px]">
                  <img src={form.imagen_url} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">Ahorro estimado para el usuario ($) *</label>
              <input type="number" value={form.ahorro_estimado} onChange={set('ahorro_estimado')} placeholder="Ej: 5000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {Number(form.ahorro_estimado) > 0 ? (
                <div className="mt-2 flex flex-col gap-1 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                  <span className="text-xs font-semibold text-emerald-700">
                    En la tarjeta: “Ahorrás ${Number(form.ahorro_estimado).toLocaleString('es-AR')} aprox. · Ganás {Math.round(Number(form.ahorro_estimado) / 4).toLocaleString('es-AR')} pts.”
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600">
                    Precio de cupón sugerido: {Math.max(1, Math.round(calcularPrecioCupon(Number(form.ahorro_estimado)) / CREDITO_TOTAL))} crédito(s) · AR${(Math.max(1, Math.round(calcularPrecioCupon(Number(form.ahorro_estimado)) / CREDITO_TOTAL)) * CREDITO_TOTAL).toLocaleString('es-AR')} (IVA incl.)
                  </span>
                </div>
              ) : (
                <p className="text-slate-400 text-xs font-medium mt-1">Se muestra en la tarjeta como “Ahorrás $X aprox.” y define los puntos que gana el turista.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">Fecha de vencimiento (opcional)</label>
              <input type="date" value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
              />
              <p className="text-slate-400 text-xs font-medium mt-1">Sin fecha: se desactiva automáticamente a los 45 días de aprobarse.</p>
            </div>
          </section>

          {/* Alianzas */}
          <section className="space-y-3">
            <div>
              <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-1">
                Alianzas con alojamientos <span className="text-slate-400 font-medium normal-case">(no obligatorio)</span>
              </h3>
              <p className="text-slate-400 text-xs font-medium">
                Podés dar un mejor beneficio en hasta 3 alojamientos. Tu oferta aparecerá destacada en su ficha.
              </p>
            </div>

            {alianzas.map((al, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-black text-slate-700 text-xs">Alojamiento {i + 1}</p>
                  <button onClick={() => eliminarAlianza(i)} className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer transition-colors">
                    <Trash2 size={12} /> Eliminar alianza
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">Alojamiento</label>
                  <select
                    value={al.negocio_id}
                    onChange={e => actualizarAlianza(i, 'negocio_id', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="">Seleccioná un alojamiento...</option>
                    {[...alojDisponibles, ...(al.negocio_id ? alojamientos.filter(a => a.id === al.negocio_id) : [])].map(a => (
                      <option key={a.id} value={a.id}>{a.nombre} · {a.localidad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">Beneficio mejorado para sus huéspedes</label>
                  <input
                    value={al.beneficio_mejorado}
                    onChange={e => actualizarAlianza(i, 'beneficio_mejorado', e.target.value)}
                    placeholder="Ej: 20% de descuento (en vez del 15% habitual)"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
            ))}

            {alianzas.length < 3 && (
              <button
                onClick={agregarAlianza}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm cursor-pointer transition-colors"
              >
                <Plus size={16} />
                {alianzas.length === 0 ? 'Agregar alianza con alojamiento' : 'Agregar otro'}
              </button>
            )}
          </section>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 space-y-3">
          {/* Botones de aprobación — solo visibles si viene del superadmin */}
          {oferta?.id && (
            <div className="flex items-center gap-2">
              {!oferta.aprobada ? (
                <button
                  onClick={async () => {
                    await supabase.from('promociones').update({ aprobada: true, activa: true }).eq('id', oferta.id);
                    onSave({ ...oferta, aprobada: true, activa: true }, false);
                  }}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Aprobar oferta
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await supabase.from('promociones').update({ aprobada: false, activa: false }).eq('id', oferta.id);
                    onSave({ ...oferta, aprobada: false, activa: false }, false);
                  }}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-black text-sm rounded-xl cursor-pointer transition-all"
                >
                  Desaprobar oferta
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button onClick={guardar} disabled={saving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black text-sm rounded-xl cursor-pointer"
            >
              {saving ? 'Guardando...' : esNueva ? 'Enviar para aprobación' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
