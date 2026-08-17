// ============================================================
//  src/components/OfertaEditorDrawer.jsx
// ============================================================

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Users, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calcularPrecioCupon, CREDITO_TOTAL } from '../lib/cobros';
import { puntosDeCompra } from '../lib/gamificacion';
import { DEFAULT_TIERS, validarTramos } from '../lib/grupos';
import { sanitizeTituloOferta } from '../lib/ofertas';
const TIPOS_ALOJ = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];
// Set más amplio para detectar si el negocio actual es un alojamiento
const ES_ALOJ_TIPOS = new Set(['Hotel','Cabaña','Departamento','Casa','Hostel','Dormi','Domo','Carpa','Glamping']);
const MODALIDADES_AHORRO = [
  { value: 'por_noche',          label: 'por noche' },
  { value: 'por_persona',        label: 'por persona' },
  { value: 'en_toda_la_estadia', label: 'en toda la estadía' },
];

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
    ahorro_modalidad: oferta?.ahorro_modalidad || '',
    fecha_vencimiento: oferta?.fecha_vencimiento ? oferta.fecha_vencimiento.split('T')[0] : '',
  });

  // ── Cupón grupal ──
  const [esGrupal, setEsGrupal] = useState(oferta?.is_group || false);
  const [grupo, setGrupo]       = useState({
    group_min_pax: oferta?.group_min_pax ?? 2,
    group_max_pax: oferta?.group_max_pax ?? 12,
    base_price_pp: oferta?.base_price_pp ?? '',
  });
  const [tramos, setTramos]     = useState(
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

  // ── Stock / límite físico de canjes ──
  const [tieneStock, setTieneStock] = useState(oferta?.tiene_stock || false);
  const [stockMax, setStockMax]     = useState(oferta?.stock_maximo ?? 50);

  // Alianzas: array de { negocio_id, nombre, beneficio_mejorado }
  const [alianzas, setAlianzas]         = useState([]);
  const [alojamientos, setAlojamientos] = useState([]);
  const [esAlojamiento, setEsAlojamiento] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('negocios')
        .select('id, nombre, tipo, localidad')
        .in('tipo', TIPOS_ALOJ)
        .eq('activo', true)
        .order('nombre');
      setAlojamientos(data || []);

      // ¿El negocio de esta oferta es un alojamiento? (define si pedimos modalidad de ahorro)
      if (negocioId) {
        const { data: negActual } = await supabase.from('negocios').select('tipo').eq('id', negocioId).single();
        setEsAlojamiento(!negActual?.tipo || ES_ALOJ_TIPOS.has(negActual.tipo));
      }

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
    const tituloLimpio = sanitizeTituloOferta(form.titulo).trim();
    if (!tituloLimpio) return setError('El título es obligatorio y solo puede tener letras y números');
    if (!(Number(form.ahorro_estimado) > 0)) return setError('Ingresá el ahorro estimado para el usuario (mayor a $0)');
    if (esAlojamiento && !form.ahorro_modalidad) return setError('Elegí a qué corresponde el ahorro (por noche, por persona o toda la estadía)');
    if (esGrupal) {
      const { ok, errores } = validarTramos({
        minPax: grupo.group_min_pax,
        maxPax: grupo.group_max_pax,
        basePricePp: grupo.base_price_pp,
        tramos,
      });
      if (!ok) return setError(errores[0]);
    }
    setSaving(true); setError('');

    const payload = {
      titulo:          tituloLimpio,
      subtitulo:       form.subtitulo,
      badge:           form.badge,
      descripcion:     form.descripcion,
      imagen_url:      form.imagen_url,
      offer_type:      form.offer_type,
      ahorro_estimado: form.ahorro_estimado ? Number(form.ahorro_estimado) : null,
      ahorro_modalidad: esAlojamiento ? (form.ahorro_modalidad || null) : null,
      fecha_vencimiento: form.fecha_vencimiento ? new Date(form.fecha_vencimiento).toISOString() : null,
      negocio_id:      negocioId,
      activa:          false,
      aprobada:        false,
      // Cupón grupal
      // Stock / límite físico
      tiene_stock:     tieneStock,
      stock_maximo:    tieneStock ? Number(stockMax) : null,
      stock_restante:  tieneStock ? (oferta?.stock_restante ?? Number(stockMax)) : null,
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
              <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: sanitizeTituloOferta(e.target.value) }))} placeholder="Ej: 2x1 en la mítica tarde de churros."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <p className="mt-1 text-[11px] text-slate-400">Solo letras y números, sin puntuación ni símbolos (%, -, etc.).</p>
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
                    {/* Los puntos son el 5% de lo que el turista PAGA por el
                        cupón, no una fracción del ahorro declarado: con 1 punto
                        = $1, calcular sobre el ahorro promete crédito por varias
                        veces la venta. Ver lib/gamificacion.js. */}
                    En la tarjeta: “Ahorrás ${Number(form.ahorro_estimado).toLocaleString('es-AR')} aprox. · Ganás {puntosDeCompra(calcularPrecioCupon(Number(form.ahorro_estimado))).toLocaleString('es-AR')} pts.”
                    {esAlojamiento && form.ahorro_modalidad ? ` (${MODALIDADES_AHORRO.find(m => m.value === form.ahorro_modalidad)?.label})` : ''}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600">
                    Precio de cupón sugerido: {Math.max(1, Math.round(calcularPrecioCupon(Number(form.ahorro_estimado)) / CREDITO_TOTAL))} crédito(s) · ${(Math.max(1, Math.round(calcularPrecioCupon(Number(form.ahorro_estimado)) / CREDITO_TOTAL)) * CREDITO_TOTAL).toLocaleString('es-AR')} (IVA incl.)
                  </span>
                </div>
              ) : (
                <p className="text-slate-400 text-xs font-medium mt-1">Se muestra en la tarjeta como “Ahorrás $X aprox.” y define los puntos que gana el turista.</p>
              )}
            </div>

            {esAlojamiento && (
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">¿A qué corresponde el ahorro? *</label>
                <select value={form.ahorro_modalidad} onChange={set('ahorro_modalidad')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">Elegí una opción…</option>
                  {MODALIDADES_AHORRO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <p className="text-slate-400 text-xs font-medium mt-1">Se muestra debajo del ahorro (ej. “por noche”). Obligatorio en alojamientos.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">Fecha de vencimiento (opcional)</label>
              <input type="date" value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
              />
              <p className="text-slate-400 text-xs font-medium mt-1">Sin fecha: se desactiva automáticamente a los 45 días de aprobarse.</p>
            </div>
          </section>

          {/* Stock / límite físico */}
          <section className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
              <input type="checkbox" checked={tieneStock} onChange={e => setTieneStock(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-amber-500 cursor-pointer" />
              <span>
                <span className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <Package size={16} className="text-amber-500" /> ¿Tiene stock o límite físico?
                </span>
                <span className="block text-slate-500 text-xs font-medium mt-0.5">
                  Activalo si hay una cantidad limitada de canjes disponibles.
                </span>
              </span>
            </label>

            {tieneStock && (
              <div className="pl-1">
                <label className="block text-xs font-black text-slate-500 mb-1.5">Cantidad máxima de canjes</label>
                <input type="number" min={1} value={stockMax} onChange={e => setStockMax(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
                <p className="text-slate-400 text-xs font-medium mt-1">Por defecto 50. Cuando queden pocos, se destaca en la tarjeta del cupón.</p>
              </div>
            )}
          </section>

          {/* Cupón grupal */}
          <section className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
              <input type="checkbox" checked={esGrupal} onChange={e => setEsGrupal(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-violet-600 cursor-pointer" />
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
              <div className="space-y-4 pl-1">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1.5">Mín. personas</label>
                    <input type="number" min={2} value={grupo.group_min_pax} onChange={setGrupoField('group_min_pax')}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1.5">Máx. personas</label>
                    <input type="number" min={2} value={grupo.group_max_pax} onChange={setGrupoField('group_max_pax')}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1.5">Precio p/persona</label>
                    <input type="number" min={0} value={grupo.base_price_pp} onChange={setGrupoField('base_price_pp')} placeholder="$"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">Tramos de descuento por persona</label>
                  <p className="text-slate-400 text-[11px] font-medium mb-2.5">Rangos contiguos sin huecos, descuento creciente. Arrancan en el mínimo y terminan en el máximo.</p>
                  <div className="space-y-2">
                    {tramos.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-2">
                        <span className="text-[11px] font-black text-slate-400 w-4 text-center shrink-0">{i + 1}</span>
                        <input type="number" min={1} value={t.min_pax} onChange={e => actualizarTramo(i, 'min_pax', e.target.value)}
                          className="w-12 px-1.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center focus:outline-none" />
                        <span className="text-slate-400 text-xs">a</span>
                        <input type="number" min={1} value={t.max_pax} onChange={e => actualizarTramo(i, 'max_pax', e.target.value)}
                          className="w-12 px-1.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center focus:outline-none" />
                        <span className="text-slate-500 text-[11px] font-medium mr-auto">pers.</span>
                        <input type="number" min={0} max={100} value={t.discount_pct} onChange={e => actualizarTramo(i, 'discount_pct', e.target.value)}
                          className="w-14 px-1.5 py-2 bg-violet-50 border border-violet-200 rounded-lg text-sm font-black text-violet-700 text-center focus:outline-none" />
                        <span className="text-slate-500 text-[11px] font-bold">%</span>
                        <button onClick={() => eliminarTramo(i)} disabled={tramos.length <= 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 p-1">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={agregarTramo} className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-bold text-sm cursor-pointer mt-2.5">
                    <Plus size={15} /> Agregar tramo
                  </button>
                </div>
              </div>
            )}
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
                  <label className="block text-xs font-black text-slate-500 mb-1.5">Beneficio mejorado para sus turistas</label>
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
