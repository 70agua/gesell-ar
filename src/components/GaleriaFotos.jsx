// ============================================================
//  src/components/GaleriaFotos.jsx
//  Galería de fotos del perfil de un negocio — compartida entre
//  el panel del socio (TabEmpresa) y el wizard de alta. Componente
//  controlado: no sube nada solo, el padre decide cuándo persistir
//  (mismo patrón que ya usa el logo hoy).
// ============================================================
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';

const P = '#475BE1';
const INK = '#0B1020';
const MUTED = '#6B7280';
const LINE = '#E7E9EE';
const FONT = "'Inter', system-ui, sans-serif";

export default function GaleriaFotos({ fotos, onChange, maxFotos }) {
  const fotoRef = useRef();
  const [isDragOver, setIsDragOver] = useState(false);
  const alTope = fotos.length >= maxFotos;

  const addFiles = (files) => {
    if (alTope) return;
    const restantes = maxFotos - fotos.length;
    [...(files || [])]
      .filter(f => f.type.startsWith('image/'))
      .slice(0, restantes)
      .forEach(f => onChange([...fotos, { id: Date.now() + Math.random(), file: f, src: URL.createObjectURL(f) }]));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const quitar = (id) => onChange(fotos.filter(f => f.id !== id));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK }}>Galería de imágenes</span>
        <button type="button" onClick={() => fotoRef.current?.click()} disabled={alTope}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1px dashed ${P}`, background: '#eef1fd', color: P, fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: alTope ? 'not-allowed' : 'pointer', opacity: alTope ? 0.5 : 1 }}>
          <Upload size={14} /> Agregar fotos
        </button>
        <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, marginBottom: 14, alignItems: 'flex-start' }}>
        <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11.5, color: '#92400e', fontFamily: FONT, lineHeight: 1.5 }}>
          Las fotos deben mostrar exclusivamente el lugar o servicio — sin textos, logos ni gráficas superpuestas. La primera foto es la imagen principal de tu perfil.
          {' '}Tu plan permite hasta {maxFotos} fotos ({fotos.length}/{maxFotos}).
        </span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!alTope) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        style={{ borderRadius: 14, outline: isDragOver ? `2px dashed ${P}` : '2px dashed transparent', outlineOffset: 3, transition: 'outline .15s' }}
      >
        {fotos.length === 0 ? (
          <div
            onClick={() => fotoRef.current?.click()}
            style={{ height: 140, border: `2px dashed ${isDragOver ? P : LINE}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: isDragOver ? P : MUTED, cursor: 'pointer', transition: 'all .15s' }}
          >
            <ImageIcon size={28} color={isDragOver ? P : LINE} />
            <span style={{ fontSize: 13, fontFamily: FONT }}>Subí fotos o arrastrá archivos desde tu computadora</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 90, gap: 8 }}>
            {fotos.map((f, idx) => (
              <div key={f.id} style={{ position: 'relative', borderRadius: idx === 0 ? 12 : 8, overflow: 'hidden', gridColumn: idx === 0 ? 'span 2' : undefined, gridRow: idx === 0 ? 'span 2' : undefined }}>
                <img src={f.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {idx === 0 ? (
                  <div style={{ position: 'absolute', bottom: 7, left: 7, background: P, color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5, fontFamily: FONT, letterSpacing: '0.06em' }}>
                    PRINCIPAL
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: 5, left: 5, width: 18, height: 18, borderRadius: 5, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: FONT }}>{idx + 1}</span>
                  </div>
                )}
                <button type="button" onClick={() => quitar(f.id)}
                  style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <Trash2 size={10} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
