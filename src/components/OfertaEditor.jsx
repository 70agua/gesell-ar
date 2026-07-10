// ============================================================
//  src/components/OfertaEditor.jsx
//  Pantalla completa de edición de oferta (dentro del panel)
// ============================================================

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { debeUsarTokens, getSaldo, descontarToken } from '../lib/cobros';
import { CoinSVG } from './Token';
import { DEFAULT_TIERS, validarTramos } from '../lib/grupos';

const TIPOS_ALOJ = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];

export default function OfertaEditor({ oferta, negocio, onVolver, onSave, onNecesitaTokens }) {
  const esNueva = !oferta?.id;
  const requiereTokens = negocio && debeUsarTokens(negocio.tipo, negocio.plan);

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

  // ── Cupón grupal ──
  const [esGrupal, setEsGrupal]     = useState(oferta?.is_group || false);
  const [grupo, setGrupo]           = useState({
    group_min_pax: oferta?.group_min_pax ?? 2,
    group_max_pax: oferta?.group_max_pax ?? 12,
    base_price_pp: oferta?.base_price_pp ?? '',
  });
  const [tramos, setTramos]         = useState(
    Array.isArray(oferta?.group_tiers) && oferta.group_tiers.length ? oferta.group_tiers : DEFAULT_TIERS
  );
  const setGrupoField = k => e => setGrupo(g => ({ ...g, [k]: e.target.value }));
  const actualizarTramo = (i, key, value) =>
    setTramos(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: value === '' ? '' : Number(value) } : t));
  const agregarTramo = () => setTramos(prev => {
    const ult = prev[prev.length - 1];
    const desde = ult ? Number(ult.max_pax) + 1 : Number(grupo.group_min_pax) || 2;
    return [...prev, { min_pax: desde, max_pax: desde + 1, discount_pct: (Number(ult?.discount_pct) || 0) + 5 }];
  });
  const eliminarTramo = (i) => setTramos(prev => prev.filter((_, idx) => idx !== i));

  const [alianzas, setAlianzas]     = useState([]);
  const [alojamientos, setAlojamientos] = useState([]);
  const [saldo, setSaldo]           = useState(0);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    async function cargar() {
      // Cargar alojamientos para alianzas
      const { data: aloj } = await supabase
        .from('negocios')
        .select('id, nombre, tipo, localidad')
        .in('tipo', TIPOS_ALOJ)
        .eq('aprobado', true)
        .order('nombre');
      setAlojamientos(aloj || []);

      // Cargar alianzas si es edición
      if (oferta?.id) {
        const { data: al } = await supabase
          .from('alianzas')
          .select('*, negocios(nombre, localidad)')
          .eq('promocion_id', oferta.id);
        if (al) setAlianzas(al.map(a => ({
          id: a.id,
          negocio_id: a.negocio_id,
          nombre: a.negocios?.nombre,
          localidad: a.negocios?.localidad,
          beneficio_mejorado: a.descripcion || '',
        })));
      }

      // Cargar saldo de créditos si aplica
      if (requiereTokens && negocio?.id) {
        const s = await getSaldo(negocio.id);
        setSaldo(s);
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
        const aloj = alojamientos.find(x => x.id === value);
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

    // Validar config grupal si está activada
    if (esGrupal) {
      const { ok, errores } = validarTramos({
        minPax: grupo.group_min_pax,
        maxPax: grupo.group_max_pax,
        basePricePp: grupo.base_price_pp,
        tramos,
      });
      if (!ok) return setError(errores[0]);
    }

    // Si es alojamiento FREE creando oferta nueva → verificar tokens
    if (esNueva && requiereTokens) {
      if (saldo < 1) {
        // Guardar el form en sessionStorage para recuperarlo después de comprar
        sessionStorage.setItem('oferta_pendiente', JSON.stringify(form));
        onNecesitaTokens(form);
        return;
      }
    }

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
      negocio_id:      negocio.id,
      activa:          false,
      aprobada:        false,
      // Cupón grupal
      is_group:        esGrupal,
      group_min_pax:   esGrupal ? Number(grupo.group_min_pax) : null,
      group_max_pax:   esGrupal ? Number(grupo.group_max_pax) : null,
      base_price_pp:   esGrupal ? Number(grupo.base_price_pp) : null,
      group_tiers:     esGrupal
        ? [...tramos]
            .map(t => ({ min_pax: Number(t.min_pax), max_pax: Number(t.max_pax), discount_pct: Number(t.discount_pct) }))
            .sort((a, b) => a.min_pax - b.min_pax)
        : null,
    };

    let result;
    if (esNueva) {
      const { data, error: err } = await supabase.from('promociones').insert(payload).select().single();
      if (err) { setSaving(false); return setError('Error al crear la oferta'); }
      result = data;
      // Descontar token si aplica
      if (requiereTokens) await descontarToken(negocio.id);
    } else {
      const { data, error: err } = await supabase.from('promociones').update({
        ...payload,
        // Al editar NO tocar aprobada/activa
      }).eq('id', oferta.id).select().single();
      if (err) { setSaving(false); return setError('Error al guardar'); }
      result = data;
    }

    // Guardar alianzas
    if (result?.id) {
      await supabase.from('alianzas').delete().eq('promocion_id', result.id);
      const nuevas = alianzas.filter(a => a.negocio_id);
      if (nuevas.length > 0) {
        await supabase.from('alianzas').insert(nuevas.map(a => ({
          promocion_id: result.id,
          negocio_id:   a.negocio_id,
          tipo:         'potenciada',
          descripcion:  a.beneficio_mejorado,
          aprobada:     true,
        })));
      }
    }

    setSaving(false);
    onSave(result, esNueva);
  }

  const alojDisponibles = alojamientos.filter(a => !alianzas.find(al => al.negocio_id === a.id));

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onVolver} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors cursor-pointer">
          <ArrowLeft size={18} /> Volver a mis ofertas
        </button>
        {requiereTokens && (
          <div className="ml-auto flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
            <CoinSVG size={20} />
            <span className="font-black text-amber-800 text-sm">{saldo} créditos disponibles</span>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-black text-slate-900 mb-8">
        {esNueva ? 'Nueva oferta' : 'Editar oferta'}
      </h1>

      {/* Aviso tokens para alojamiento FREE */}
      {requiereTokens && esNueva && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl mb-6 ${saldo > 0 ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
          <CoinSVG size={22} />
          <div>
            {saldo > 0 ? (
              <>
                <p className="font-black text-green-800 text-sm">Tenés {saldo} token{saldo !== 1 ? 's' : ''} disponible{saldo !== 1 ? 's' : ''}</p>
                <p className="text-green-600 text-xs font-medium mt-0.5">Al publicar se descontará 1 token automáticamente.</p>
              </>
            ) : (
              <>
                <p className="font-black text-amber-800 text-sm">No tenés créditos disponibles</p>
                <p className="text-amber-600 text-xs font-medium mt-0.5">Al hacer clic en "Publicar" te mostraremos las opciones de compra.</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Columna izquierda */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Título *</label>
            <input value={form.titulo} onChange={set('titulo')} placeholder="Ej: 2x1 en la mítica tarde de churros."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Badge</label>
              <input value={form.badge} onChange={set('badge')} placeholder="Ej: -50%, 2x1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo</label>
              <select value={form.offer_type} onChange={set('offer_type')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="Normal">Normal</option>
                <option value="Flash">⚡ Flash Sale</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Subtítulo</label>
            <input value={form.subtitulo} onChange={set('subtitulo')} placeholder="Ej: Solo por este fin de semana"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Descripción ampliada</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={4}
              placeholder="Describí en detalle qué incluye, condiciones, vigencia, etc."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ahorro estimado ($)</label>
            <input type="number" value={form.ahorro_estimado} onChange={set('ahorro_estimado')} placeholder="Ej: 5000"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <p className="text-slate-400 text-xs font-medium mt-1">Ayuda al equipo a determinar el valor en créditos. No se muestra públicamente.</p>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-5">
          {/* Imagen */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Imagen</label>
            <input value={form.imagen_url} onChange={set('imagen_url')} placeholder="https://..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 mb-2"
            />
            {form.imagen_url ? (
              <div className="aspect-square rounded-2xl overflow-hidden border border-slate-100">
                <img src={form.imagen_url} alt="preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                <p className="text-slate-300 font-medium text-sm">Vista previa</p>
              </div>
            )}
          </div>

          {/* Alianzas */}
          <div>
            <div className="mb-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                Alianzas con alojamientos <span className="text-slate-400 font-medium normal-case">(no obligatorio)</span>
              </label>
              <p className="text-slate-400 text-xs font-medium">Ofrecé un beneficio mejorado en hasta 3 alojamientos.</p>
            </div>

            <div className="space-y-3">
              {alianzas.map((al, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-slate-700 text-xs">Alojamiento {i + 1}</p>
                    <button onClick={() => eliminarAlianza(i)} className="flex items-center gap-1 text-orange-400 hover:text-orange-600 text-xs font-bold cursor-pointer">
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                  <select value={al.negocio_id} onChange={e => actualizarAlianza(i, 'negocio_id', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="">Seleccioná un alojamiento...</option>
                    {[...alojDisponibles, ...(al.negocio_id ? alojamientos.filter(a => a.id === al.negocio_id) : [])].map(a => (
                      <option key={a.id} value={a.id}>{a.nombre} · {a.localidad}</option>
                    ))}
                  </select>
                  <input value={al.beneficio_mejorado} onChange={e => actualizarAlianza(i, 'beneficio_mejorado', e.target.value)}
                    placeholder="Ej: 20% de descuento (en vez del 15% habitual)"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ))}
              {alianzas.length < 3 && (
                <button onClick={agregarAlianza} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm cursor-pointer">
                  <Plus size={16} /> {alianzas.length === 0 ? 'Agregar alianza' : 'Agregar otro'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cupón grupal ── */}
      <div className="mt-8 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={esGrupal}
            onChange={e => setEsGrupal(e.target.checked)}
            className="mt-1 w-5 h-5 accent-violet-600 cursor-pointer"
          />
          <span>
            <span className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <Users size={16} className="text-violet-600" /> Más ahorro viajando en grupo
            </span>
            <span className="block text-slate-500 text-xs font-medium mt-0.5">
              El organizador declara cuántos van y paga una sola persona. A más beneficiarios, mayor descuento por persona.
            </span>
          </span>
        </label>

        {esGrupal && (
          <div className="mt-5 space-y-5">
            {/* Piso / techo / precio base */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Mínimo de personas</label>
                <input type="number" min={2} value={grupo.group_min_pax} onChange={setGrupoField('group_min_pax')}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Máximo de personas</label>
                <input type="number" min={2} value={grupo.group_max_pax} onChange={setGrupoField('group_max_pax')}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Precio por persona ($)</label>
                <input type="number" min={0} value={grupo.base_price_pp} onChange={setGrupoField('base_price_pp')} placeholder="Sin descuento"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
              </div>
            </div>

            {/* Tramos de descuento */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Tramos de descuento por persona</label>
              <p className="text-slate-400 text-xs font-medium mb-3">Rangos contiguos, sin huecos, con descuento creciente. El primer tramo arranca en el mínimo y el último termina en el máximo.</p>
              <div className="space-y-2">
                {tramos.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl p-2.5">
                    <span className="text-xs font-black text-slate-400 w-6 text-center shrink-0">{i + 1}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input type="number" min={1} value={t.min_pax} onChange={e => actualizarTramo(i, 'min_pax', e.target.value)}
                        className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center focus:outline-none" />
                      <span className="text-slate-400 text-xs">a</span>
                      <input type="number" min={1} value={t.max_pax} onChange={e => actualizarTramo(i, 'max_pax', e.target.value)}
                        className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center focus:outline-none" />
                      <span className="text-slate-500 text-xs font-medium">personas</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input type="number" min={0} max={100} value={t.discount_pct} onChange={e => actualizarTramo(i, 'discount_pct', e.target.value)}
                        className="w-16 px-2 py-2 bg-violet-50 border border-violet-200 rounded-lg text-sm font-black text-violet-700 text-center focus:outline-none" />
                      <span className="text-slate-500 text-xs font-bold">% off</span>
                    </div>
                    <button onClick={() => eliminarTramo(i)} disabled={tramos.length <= 1}
                      className="text-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={agregarTramo} className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-bold text-sm cursor-pointer mt-3">
                <Plus size={16} /> Agregar tramo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botones de aprobación para superadmin */}
      {!esNueva && oferta && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {!oferta.aprobada ? (
              <button onClick={async () => {
                await supabase.from('promociones').update({ aprobada: true, activa: true }).eq('id', oferta.id);
                onSave({ ...oferta, aprobada: true, activa: true }, false);
              }} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer">
                <CheckCircle2 size={14} /> Aprobar oferta
              </button>
            ) : (
              <button onClick={async () => {
                await supabase.from('promociones').update({ aprobada: false, activa: false }).eq('id', oferta.id);
                onSave({ ...oferta, aprobada: false, activa: false }, false);
              }} className="bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-orange-600 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer">
                Desaprobar oferta
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-start gap-3 bg-orange-50 border border-orange-100 text-orange-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 flex items-center gap-3">
        <button onClick={onVolver} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm rounded-xl cursor-pointer">
          Cancelar
        </button>
        <button onClick={guardar} disabled={saving}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black text-sm rounded-xl cursor-pointer transition-all"
        >
          {saving ? 'Guardando...' : esNueva
            ? (requiereTokens && saldo < 1 ? '🪙 Continuar para comprar créditos' : 'Enviar para aprobación')
            : 'Guardar cambios'
          }
        </button>
      </div>
    </div>
  );
}
