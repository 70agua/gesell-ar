// ============================================================
//  src/components/PerfilNegocioForm.jsx
//  Formulario de perfil de negocio — fuente única compartida entre
//  el wizard de alta (LoginView) y el panel del socio (AdminNegocioView),
//  para que ambos muestren EXACTAMENTE los mismos campos, tamaños y
//  posiciones. Controlado: el padre tiene el objeto `value` y recibe
//  `onChange`. No incluye galería ni botón de submit (los maneja el padre).
// ============================================================
import { useRef, useState } from 'react';
import { Hotel, UtensilsCrossed, Sparkles } from 'lucide-react';
import UbicacionMap from './UbicacionMap';
import { CATEGORIAS_GASTRO } from '../lib/perfilNegocio';

// Tokens (idénticos a los del wizard y el panel)
const P = '#475be1', PS = '#eef0fd', INK = '#0f172a', INK2 = '#475569';
const MUTED = '#94a3b8', LINE = '#e2e8f0', BG = '#f8fafc';
const FONT = "'Inter', system-ui, sans-serif";
const RED = '#ef4444';

const DESC_MIN = 40, DESC_MAX = 450;

const TIPOS_RUBRO = [
  { id: 'alojamiento',    label: 'Alojamiento',     Icon: Hotel },
  { id: 'salidas',        label: 'Salidas',          Icon: UtensilsCrossed },
  { id: 'aventura_relax', label: 'Aventura & Relax', Icon: Sparkles },
];

const CATS_RUBRO = {
  alojamiento:    ['Hotel', 'Apart', 'Complejo', 'Hostería', 'Resort', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Glamping'],
  salidas:        ['Restaurantes', 'Bares', 'Cafés & Dulces', 'Heladerías', 'Panaderías', 'Discotecas', 'Cines y Teatros', 'Shows y Recitales', 'Centros Culturales', 'Otros'],
  aventura_relax: ['Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga / Bienestar', 'Masajes a domicilio', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos'],
};

const SERVICIOS_ALOJ = [
  'WiFi', 'Estacionamiento', 'Pileta', 'Desayuno incluido',
  'Aire acondicionado', 'Calefacción', 'Cocina equipada', 'Parrilla',
  'Lavarropas', 'Secador de cabello', 'TV Smart', 'Ropa de cama',
  'Toallas incluidas', 'Caja fuerte', 'Recepción 24 hs', 'Terraza / Balcón',
  'Vista al mar', 'Bicicletas', 'Jardín / Patio', 'Servicio de limpieza',
];

const TIPOS_COCINA = [
  'Parrilla / Asador', 'Pizzería', 'Pastas', 'Cocina de mar', 'Regional',
  'Comida rápida', 'Minutas', 'De autor', 'Vegetariana / Vegana', 'Heladería',
  'Pastelería / Panadería', 'Cafetería', 'Cervecería', 'Vinos / Cócteles',
  'Internacional', 'Otros',
];

const PAISES = ['Argentina', 'Uruguay', 'Chile', 'Brasil', 'Paraguay', 'Bolivia', 'Otro'];
const COD_PAISES = ['+54', '+598', '+56', '+55', '+595', '+591', '+1', '+34', '+39', '+44'];
const LOCALIDADES = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul'];
const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

// ─── Estilos base ─────────────────────────────────────────────
const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 13, color: INK, outline: 'none', background: '#fff', transition: 'border-color .15s' };
const lbl = { fontFamily: FONT, fontSize: 11, fontWeight: 700, color: INK2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

const Card = ({ children }) => <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${LINE}`, padding: 20 }}>{children}</div>;
const CardTitle = ({ label }) => <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${LINE}` }}>{label}</div>;
const ErrMsg = ({ msg }) => msg ? <span style={{ fontSize: 11, color: RED, marginTop: 3, display: 'block', fontFamily: FONT }}>{msg}</span> : null;
const Req = () => <span style={{ color: RED }}>*</span>;

function Checkbox({ label, checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', border: `1.5px solid ${checked ? P : LINE}`, borderRadius: 10, background: checked ? PS : '#fff', cursor: 'pointer', userSelect: 'none', transition: 'all .15s' }}>
      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? P : LINE}`, background: checked ? P : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: checked ? P : INK2 }}>{label}</span>
    </div>
  );
}

function Chips({ opciones, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {opciones.map(o => {
        const sel = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => onToggle(o)}
            style={{ padding: '7px 13px', borderRadius: 999, fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${sel ? P : LINE}`, background: sel ? P : '#fff', color: sel ? '#fff' : INK2, transition: 'all .15s' }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function PerfilNegocioForm({ value: v, onChange, errors = {} }) {
  const logoRef = useRef();
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const debounce = useRef(null);

  const set = (k, val) => onChange({ ...v, [k]: val });
  const inpE = (f) => ({ ...inp, borderColor: errors[f] ? RED : LINE });
  const toggleCat = (c) => set('cats', v.cats.includes(c) ? v.cats.filter(x => x !== c) : (v.cats.length >= 2 ? v.cats : [...v.cats, c]));
  const toggle = (k, item) => set(k, v[k].includes(item) ? v[k].filter(x => x !== item) : [...v[k], item]);

  const esGastro = v.tipo === 'salidas' && v.cats.some(c => CATEGORIAS_GASTRO.has(c));

  function handleLogo(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => onChange({ ...v, logoFile: f, logoPreview: ev.target.result });
    reader.readAsDataURL(f);
  }

  function handleDireccion(texto) {
    onChange({ ...v, calle: texto });
    clearTimeout(debounce.current);
    if (texto.trim().length < 4) { setSugerencias([]); return; }
    debounce.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const q = encodeURIComponent(`${texto}, ${v.localidad || 'Villa Gesell'}, Argentina`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ar&limit=5&q=${q}`);
        setSugerencias(await res.json() || []);
      } catch { setSugerencias([]); }
      finally { setBuscando(false); }
    }, 400);
  }

  function elegirSugerencia(s) {
    onChange({ ...v, calle: s.display_name.split(',').slice(0, 2).join(',').trim(), latLng: [Number(s.lat), Number(s.lon)] });
    setSugerencias([]);
  }

  return (
    <>
      {/* ── Identidad ── */}
      <Card>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div onClick={() => logoRef.current?.click()} style={{ width: 168, height: 168, borderRadius: 20, border: `2px dashed ${v.logoPreview ? P : LINE}`, cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
              {v.logoPreview
                ? <img src={v.logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: LINE, display: 'grid', placeItems: 'center' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
                        <path d="M12 4.5 L16.5 12 L7.5 12 Z" />
                        <circle cx="8" cy="17" r="3" />
                        <rect x="13" y="14" width="6" height="6" rx="1" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, fontFamily: FONT, textAlign: 'center' }}>Imagen de perfil<br/>(Logotipo ó foto)</span>
                    <span style={{ fontSize: 10, color: MUTED, fontFamily: FONT }}>(Opcional)</span>
                  </div>
                )
              }
            </div>
            <button type="button" onClick={() => logoRef.current?.click()} style={{ fontSize: 11, fontWeight: 700, color: P, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>{v.logoPreview ? 'Cambiar imagen' : 'Subir imagen'}</button>
            <span style={{ fontSize: 10, color: MUTED, textAlign: 'center', maxWidth: 120, lineHeight: 1.4 }}>PNG/JPG · hasta 5 MB</span>
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Nombre del negocio <Req /></label>
              <input value={v.nombre} onChange={e => set('nombre', e.target.value)} style={inpE('nombre')} placeholder="Ej: Hotel La Costa" />
              <ErrMsg msg={errors.nombre} />
            </div>
            <div>
              <label style={lbl}>Acerca de tu negocio:</label>
              <textarea value={v.descripcion} onChange={e => set('descripcion', e.target.value.slice(0, DESC_MAX))} rows={4}
                placeholder="Ej: Somos un hotel familiar a media cuadra del mar, con pileta, desayuno y estacionamiento..."
                style={{ ...inpE('descripcion'), resize: 'vertical', minHeight: 90 }} />
              <ErrMsg msg={errors.descripcion} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: v.descripcion.length > DESC_MAX * 0.9 ? RED : MUTED }}>{v.descripcion.length} / {DESC_MAX} · mínimo {DESC_MIN}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Rubro ── */}
      <Card>
        <CardTitle label="Rubro de tu negocio" />
        <label style={lbl}>Tipo <Req /></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {TIPOS_RUBRO.map(t => {
            const sel = v.tipo === t.id;
            return (
              <button key={t.id} type="button" onClick={() => onChange({ ...v, tipo: t.id, cats: [] })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${sel ? P : LINE}`, background: sel ? PS : '#fff', color: sel ? P : INK2, transition: 'all .15s' }}>
                <t.Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
        <ErrMsg msg={errors.tipo} />
        {v.tipo && (
          <div style={{ marginTop: 16 }}>
            <label style={lbl}>Categorías — elegí hasta 2 <Req /></label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {CATS_RUBRO[v.tipo].map(c => {
                const sel = v.cats.includes(c);
                const maxed = !sel && v.cats.length >= 2;
                return (
                  <button key={c} type="button" disabled={maxed} onClick={() => toggleCat(c)}
                    style={{ padding: '7px 13px', borderRadius: 999, fontFamily: FONT, fontSize: 12, fontWeight: 600,
                      cursor: maxed ? 'not-allowed' : 'pointer', opacity: maxed ? 0.45 : 1,
                      border: `1.5px solid ${sel ? P : LINE}`, background: sel ? P : '#fff', color: sel ? '#fff' : INK2, transition: 'all .15s' }}>
                    {c}
                  </button>
                );
              })}
            </div>
            <ErrMsg msg={errors.categorias} />
          </div>
        )}
      </Card>

      {/* ── Contacto ── */}
      <Card>
        <CardTitle label="Contacto" />
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Email <Req /></label>
          <input type="email" value={v.email} onChange={e => set('email', e.target.value)} style={inpE('email')} placeholder="contacto@minegocio.com" />
          <ErrMsg msg={errors.email} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Teléfono fijo</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={v.telFijoCod} onChange={e => set('telFijoCod', e.target.value)} style={{ ...inp, width: 78, flexShrink: 0, cursor: 'pointer' }}>
                {COD_PAISES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={v.telFijoNum} onChange={e => set('telFijoNum', e.target.value)} style={inp} placeholder="2255 432100" />
            </div>
          </div>
          <div>
            <label style={lbl}>Línea móvil <Req /></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={v.telMovilCod} onChange={e => set('telMovilCod', e.target.value)} style={{ ...inp, width: 78, flexShrink: 0, cursor: 'pointer' }}>
                {COD_PAISES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={v.telMovilNum} onChange={e => set('telMovilNum', e.target.value)} style={inpE('telMovil')} placeholder="2255 11223344" />
            </div>
            <ErrMsg msg={errors.telMovil} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={lbl}>Sitio web</label>
            <input value={v.sitioWeb} onChange={e => set('sitioWeb', e.target.value)} style={inp} placeholder="https://..." />
          </div>
          <div>
            <label style={lbl}>Instagram</label>
            <input value={v.instagram} onChange={e => set('instagram', e.target.value)} style={inp} placeholder="@mi.negocio" />
          </div>
          <div>
            <label style={lbl}>Facebook</label>
            <input value={v.facebook} onChange={e => set('facebook', e.target.value)} style={inp} placeholder="/mi.negocio" />
          </div>
          <div>
            <label style={lbl}>TikTok</label>
            <input value={v.tiktok} onChange={e => set('tiktok', e.target.value)} style={inp} placeholder="@mi.negocio" />
          </div>
        </div>
      </Card>

      {/* ── Ubicación ── */}
      <Card>
        <CardTitle label="Ubicación" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>País <Req /></label>
            <select value={v.pais} onChange={e => set('pais', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Provincia <Req /></label>
            <select value={v.provincia} onChange={e => set('provincia', e.target.value)} style={{ ...inpE('provincia'), cursor: 'pointer' }}>
              <option value="">Seleccioná</option>
              {PROVINCIAS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
            </select>
            <ErrMsg msg={errors.provincia} />
          </div>
          <div>
            <label style={lbl}>Localidad <Req /></label>
            <select value={v.localidad} onChange={e => set('localidad', e.target.value)} style={{ ...inpE('localidad'), cursor: 'pointer' }}>
              <option value="">Seleccioná</option>
              {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ErrMsg msg={errors.localidad} />
          </div>
          <div>
            <label style={lbl}>Código postal <Req /></label>
            <input value={v.codPostal} onChange={e => set('codPostal', e.target.value)} style={inpE('codPostal')} placeholder="7165" maxLength={8} />
            <ErrMsg msg={errors.codPostal} />
          </div>
        </div>
        <label style={lbl}>Dirección (calle y número) <Req /></label>
        <div style={{ position: 'relative', marginBottom: 2 }}>
          <input value={v.calle} onChange={e => handleDireccion(e.target.value)} style={inpE('calle')} placeholder="Ej: Av. 3 1200" autoComplete="off" />
          <ErrMsg msg={errors.calle} />
          {(sugerencias.length > 0 || buscando) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(11,16,32,0.12)', overflow: 'hidden' }}>
              {buscando ? (
                <div style={{ padding: '10px 14px', fontSize: 12, color: MUTED, fontFamily: FONT }}>Buscando…</div>
              ) : sugerencias.map(s => (
                <div key={s.place_id} onClick={() => elegirSugerencia(s)}
                  style={{ padding: '10px 14px', fontSize: 12.5, color: INK2, fontFamily: FONT, cursor: 'pointer', borderBottom: `1px solid ${LINE}` }}
                  onMouseEnter={e => e.currentTarget.style.background = BG}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14, marginBottom: 14 }}>
          <input value={v.piso} onChange={e => set('piso', e.target.value)} style={inp} placeholder="Piso" />
          <input value={v.depto} onChange={e => set('depto', e.target.value)} style={inp} placeholder="Depto" />
          <input value={v.entreCalles} onChange={e => set('entreCalles', e.target.value)} style={inp} placeholder="Entre calles" />
        </div>
        <label style={lbl}>Ubicación en el mapa <span style={{ textTransform: 'none', fontWeight: 400, color: MUTED }}>— arrastrá el pin si no coincide con tu dirección</span></label>
        <UbicacionMap position={v.latLng} onChange={ll => set('latLng', ll)} />
      </Card>

      {/* ── Características (condicional por rubro) ── */}
      {(v.tipo === 'alojamiento' || v.tipo === 'salidas' || v.tipo === 'aventura_relax') && (
        <Card>
          <CardTitle label="Características" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {v.tipo === 'alojamiento' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Unidad más chica (m²)</label>
                    <input type="number" value={v.tamMinM2} onChange={e => set('tamMinM2', e.target.value)} style={inp} placeholder="Ej: 22" />
                  </div>
                  <div>
                    <label style={lbl}>Unidad más grande (m²)</label>
                    <input type="number" value={v.tamMaxM2} onChange={e => set('tamMaxM2', e.target.value)} style={inp} placeholder="Ej: 65" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Mín. huéspedes por unidad</label>
                    <input type="number" value={v.minHues} onChange={e => set('minHues', e.target.value)} style={inp} placeholder="Ej: 2" />
                  </div>
                  <div>
                    <label style={lbl}>Máx. huéspedes (unidad amplia)</label>
                    <input type="number" value={v.maxHues} onChange={e => set('maxHues', e.target.value)} style={inp} placeholder="Ej: 6" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Servicios incluidos</label>
                  <Chips opciones={SERVICIOS_ALOJ} selected={v.servicios} onToggle={s => toggle('servicios', s)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Checkbox label="Acepta mascotas" checked={v.aceptaMascotas} onChange={b => set('aceptaMascotas', b)} />
                  <Checkbox label="Acepta niños" checked={v.aceptaNinos} onChange={b => set('aceptaNinos', b)} />
                </div>
              </>
            )}

            {v.tipo === 'salidas' && (
              <>
                <div>
                  <label style={lbl}>Capacidad (personas)</label>
                  <input type="number" value={v.capacidad} onChange={e => set('capacidad', e.target.value)} style={{ ...inp, maxWidth: 200 }} placeholder="Ej: 80" />
                </div>
                {esGastro && (
                  <div>
                    <label style={lbl}>Tipo de cocina / bebidas</label>
                    <Chips opciones={TIPOS_COCINA} selected={v.tiposCocina} onToggle={t => toggle('tiposCocina', t)} />
                  </div>
                )}
                <Checkbox label="Requiere reserva obligatoria" checked={v.reservaObligatoria} onChange={b => set('reservaObligatoria', b)} />
              </>
            )}

            {v.tipo === 'aventura_relax' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Duración aproximada</label>
                    <input value={v.duracion} onChange={e => set('duracion', e.target.value)} style={inp} placeholder="Ej: 2 horas, jornada completa" />
                  </div>
                  <div>
                    <label style={lbl}>Participantes máximos</label>
                    <input type="number" value={v.maxPax} onChange={e => set('maxPax', e.target.value)} style={inp} placeholder="Ej: 12" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>¿La experiencia tiene sede fija?</label>
                  <select value={v.sedeFija} onChange={e => set('sedeFija', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Seleccioná</option>
                    <option value="fija">Sí, tiene dirección fija</option>
                    <option value="domicilio">No, voy al domicilio del cliente</option>
                    <option value="variable">Tiene punto de encuentro variable</option>
                  </select>
                </div>
                <Checkbox label="Requiere reserva obligatoria" checked={v.reservaObligatoria} onChange={b => set('reservaObligatoria', b)} />
              </>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
