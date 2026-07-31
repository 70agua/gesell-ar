// ============================================================
//  src/components/ChatBot.jsx
//  Asistente flotante con sugerencias de FAQ
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, ChevronRight } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';

// ─── EmailJS config ────────────────────────────────────────
const EJ_SERVICE_ID  = 'service_qeuvztw';
const EJ_TEMPLATE_ID = 'template_hclzgwc';
const EJ_PUBLIC_KEY  = 'Y25bM1g5vQF9_cMi2L_k9';

const C = {
  primary:  '#2545E6',
  ink:      '#0B1020',
  ink2:     '#3D4255',
  muted:    '#6B7280',
  line:     '#E7E9EE',
  bg:       '#F7F7F8',
  green:    '#10A36B',
};

const TOP_FAQS = [1, 2, 14];

const FAQS = [
  { id: 1,  cat: 'Pase',      q: '¿Qué es el Pase?',                            keywords: ['pase','carrito','qué es','para qué','cómo funciona'],                       a: 'El Pase te da acceso por N días a los descuentos del destino: los regulares vienen todos incluidos y los premium los elegís vos. También podés comprar cupones sueltos y guardarlos en tu carrito.' },
  { id: 4,  cat: 'Pase',      q: '¿Cómo sumo una oferta a mi carrito?',            keywords: ['agregar','añadir','sumar oferta','añadir oferta','carrito'],          a: 'Con el Gesell PaSS ya las tenés: la mayoría de los descuentos vienen incluidos. Los PLUS (más de $15.000 de ahorro) los elegís vos: entra uno por cada día de pase, y si querés más, los sumás sueltos a mitad de precio.' },
  { id: 10, cat: 'Pase',      q: '¿Puedo usar los cupones en cualquier momento?',   keywords: ['usar','cuándo','momento','activar','canjear','disponible'],            a: 'Los que necesitan reserva previa (alojamiento, spa, excursiones) los usás anticipadamente. El resto, en las fechas que elijas, mientras dure tu pase.' },
  { id: 2,  cat: 'Puntos',        q: '¿Qué son los puntos?',                            keywords: ['punto','puntos','premio','cashback','beneficio','acumular'],           a: 'Son tu cashback: sumás puntos al registrarte y cada vez que comprás. Los usás como parte de pago en tu próxima compra — y valen en todos los destinos de Cuponear, no sólo en Villa Gesell.' },
  { id: 3,  cat: 'Puntos',        q: '¿Cómo sumo puntos?',                              keywords: ['sumar','conseguir','ganar','acumular','cómo'],                        a: 'Los primeros te los damos al crear tu cuenta. Después sumás con cada cupón que comprás y con tu pase.' },
  { id: 5,  cat: 'Puntos',        q: '¿Los puntos vencen o se pierden?',                keywords: ['vencen','vencimiento','pierden','caducan','expiran'],                 a: 'No se pierden al terminar tu viaje: quedan en tu cuenta para tu próxima compra, en este destino o en cualquier otro de la red.' },
  { id: 8,  cat: 'Ofertas',       q: '¿Las ofertas tienen fecha de vencimiento?',        keywords: ['vencimiento','vence','vigencia','expira','caducidad'],               a: 'Sí. Cada oferta tiene su período de validez indicado en la ficha. Las flash expiran en horas.' },
  { id: 9,  cat: 'Ofertas',       q: '¿Qué es una oferta Flash?',                       keywords: ['flash','oferta flash','countdown','timer','tiempo limitado'],         a: 'Son descuentos con tiempo muy limitado — horas o minutos — con beneficios superiores a los habituales.' },
  { id: 6,  cat: 'Alojamientos',  q: '¿Cómo reservo un alojamiento?',                   keywords: ['reservar','reserva','alojamiento','hotel','cabaña','cómo reservo'],  a: 'Cuponear no gestiona reservas directamente. Desde la ficha del alojamiento podés consultar por fechas y presupuesto.' },
  { id: 7,  cat: 'Alojamientos',  q: '¿Qué zonas de Villa Gesell cubre la plataforma?', keywords: ['zona','zonas','cobertura','dónde','sector','barrio','mapa'],          a: 'Cubrimos Villa Gesell, Mar Azul, Mar de las Pampas, Las Gaviotas y alrededores.' },
  { id: 11, cat: 'Mi cuenta',     q: '¿Cómo me registro?',                              keywords: ['registr','crear cuenta','alta','signup','nuevo usuario'],             a: 'Hacé click en "Registrarse gratis" en el menú. Solo necesitás email y contraseña.' },
  { id: 14, cat: 'Mi cuenta',     q: '¿Es gratis usar Cuponear?',                      keywords: ['gratis','gratuito','costo','cobran','pago','sin cargo'],              a: 'Registrarte y explorar los descuentos es gratis. Para usarlos comprás el Gesell PaSS (una vez, desde $20.000) o cupones sueltos.' },
  { id: 12, cat: 'Socios',        q: '¿Cómo publico mi negocio o alojamiento?',         keywords: ['publicar','socio','negocio','alojamiento','sumarse','publicidad'],    a: 'Entrá en "Publicar oferta": cargás tu oferta y ya quedás publicado, sin costo ni plan. Si tenés un alojamiento o una agencia de turismo, además podés contratar un plan para regalarle el Pase a tus clientes.' },
  { id: 13, cat: 'Socios',        q: '¿Qué diferencia hay entre los planes de socio?',  keywords: ['plan','planes','gratis','plus','diferencia','socio'],                 a: 'Publicar es gratis para todos y no necesita plan. El plan PRO (1, 6 o 12 meses) es sólo para alojamientos y agencias de turismo: les permite regalarle el Pase a sus clientes y les da créditos publicitarios todos los meses. Un comercio no necesita plan — si quiere que su oferta se vea más, compra créditos publicitarios sueltos.' },
  { id: 15, cat: 'Ayuda',         q: '¿Cómo contacto al soporte?',                      keywords: ['soporte','ayuda','contacto','problema','error','escribir'],           a: 'Podés escribirnos por WhatsApp o desde el formulario de contacto en el pie de página.' },
];

const FAQ_CATS = ['Pase', 'Puntos', 'Ofertas', 'Alojamientos', 'Mi cuenta', 'Socios', 'Ayuda'];

function matchFaqs(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return FAQS
    .map(faq => {
      const score = faq.keywords.reduce((acc, kw) => {
        const k = kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (q.includes(k) || k.includes(q.split(' ')[0])) return acc + 2;
        if (q.split(' ').some(w => w.length > 2 && k.includes(w))) return acc + 1;
        return acc;
      }, 0);
      return { ...faq, score };
    })
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ─── Typewriter hook ──────────────────────────────────────────
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!text) { setDisplayed(''); return; }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── Avatar del bot ────────────────────────────────────────────
function BotAvatar({ size = 36, online = false }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img src="/cuponix-mini.svg" alt="Cuponix" width={size} height={size} style={{ objectFit: 'cover', borderRadius: '50%' }} />
      </div>
      {online && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: '#22C55E',
          border: '1px solid #fff', display: 'block',
        }} />
      )}
    </div>
  );
}

// ─── Chip de acción ────────────────────────────────────────────
function ActionChip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        width: '100%', textAlign: 'left', background: '#fff',
        border: `1px solid ${C.line}`, borderRadius: 10,
        padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: C.ink, fontWeight: 500,
        transition: 'border-color .15s, background .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#f0f3ff'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = '#fff'; }}
    >
      <span>{label}</span>
      <ChevronRight size={13} style={{ color: C.muted, flexShrink: 0 }} />
    </button>
  );
}

// ─── Burbuja de mensaje ────────────────────────────────────────
// instant: el mensaje ya se mostró antes (remount) → sin animación
function Bubble({ msg, onShowFaqs, instant, onSeen }) {
  const isBot = msg.from === 'bot';
  const animate = isBot && !instant;          // solo el bot nuevo se "escribe"
  const typed = useTypewriter(animate ? msg.text : null, 18);
  const displayText = isBot ? (animate ? typed : msg.text) : msg.text;
  const fullyTyped = !animate || typed.length >= (msg.text?.length ?? 0);

  // Marca el mensaje como visto al montar: no se re-animará en futuros remounts,
  // aun si su escritura quedó interrumpida.
  useEffect(() => { onSeen?.(); }, []);

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-end',
      flexDirection: isBot ? 'row' : 'row-reverse',
      animation: instant ? undefined : 'msgIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      {isBot && <BotAvatar size={28} />}
      <div style={{
        maxWidth: '82%', padding: '9px 13px',
        borderRadius: isBot ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
        background: isBot ? C.bg : C.primary,
        color: isBot ? C.ink : '#fff',
        fontSize: 13, lineHeight: 1.5,
        border: isBot ? `1px solid ${C.line}` : 'none',
      }}>
        {displayText}
        {isBot && msg.showLink && fullyTyped && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn 0.2s ease both' }}>
            <ActionChip label="Más sobre este tema" onClick={() => onShowFaqs(msg.cat)} />
            <ActionChip label="Ver todas las preguntas" onClick={() => onShowFaqs(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chip de sugerencia ────────────────────────────────────────
function SuggestionChip({ faq, onClick }) {
  return (
    <button
      onClick={() => onClick(faq)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        width: '100%', textAlign: 'left', background: '#fff',
        border: `1px solid ${C.line}`, borderRadius: 10,
        padding: '9px 12px', cursor: 'pointer', fontSize: 12, color: C.ink,
        transition: 'border-color .15s, background .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#f0f3ff'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = '#fff'; }}
    >
      <span style={{ lineHeight: 1.35 }}>{faq.q}</span>
      <ChevronRight size={13} style={{ color: C.muted, flexShrink: 0 }} />
    </button>
  );
}

// ─── Vista de todas las FAQs por categoría ────────────────────
function FaqFullScreen({ onBack, onSelect, filterCat }) {
  const cats = filterCat ? [filterCat] : FAQ_CATS;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {cats.map(cat => {
        const items = FAQS.filter(f => f.cat === cat);
        if (!items.length) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              {cat}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map(faq => (
                <button
                  key={faq.id}
                  onClick={() => onSelect(faq)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    width: '100%', textAlign: 'left', background: '#fff',
                    border: `1px solid ${C.line}`, borderRadius: 10,
                    padding: '9px 12px', cursor: 'pointer', fontSize: 12, color: C.ink,
                    transition: 'border-color .15s, background .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#f0f3ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = '#fff'; }}
                >
                  <span style={{ lineHeight: 1.35 }}>{faq.q}</span>
                  <ChevronRight size={13} style={{ color: C.muted, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Genera un captcha matemático simple ──────────────────────
function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { question: `¿Cuánto es ${a} + ${b}?`, answer: String(a + b) };
}

// ─── Formulario de contacto ────────────────────────────────────
function ContactForm({ onBack, onSent }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
  const [captcha] = useState(makeCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())   e.nombre   = 'Requerido';
    if (!form.email.includes('@')) e.email = 'Email inválido';
    if (!form.mensaje.trim())  e.mensaje  = 'Requerido';
    if (captchaInput.trim() !== captcha.answer) e.captcha = 'Respuesta incorrecta';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSending(true);
    try {
      // Queda registrada como consulta "a un humano" en el panel del superadmin (negocio_id null = Cuponix).
      const mensajeConTel = form.telefono?.trim()
        ? `${form.mensaje}\n\nTel: ${form.telefono.trim()}`
        : form.mensaje;
      await supabase.from('consultas').insert({
        negocio_id: null,
        nombre_visitante: form.nombre,
        email: form.email,
        mensaje: mensajeConTel,
      });
      await emailjs.send(EJ_SERVICE_ID, EJ_TEMPLATE_ID, {
        from_name:  form.nombre,
        from_email: form.email,
        phone:      form.telefono || '—',
        message:    form.mensaje,
        subject:    'Recibiste un mensaje de Cuponear',
      }, EJ_PUBLIC_KEY);
      onSent();
    } catch {
      setErrors({ captcha: 'Error al enviar. Intentá de nuevo.' });
    } finally {
      setSending(false);
    }
  };

  const inputStyle = (err) => ({
    width: '100%', boxSizing: 'border-box',
    border: `1px solid ${err ? '#E63946' : C.line}`,
    borderRadius: 10, padding: '9px 12px',
    fontSize: 13, outline: 'none',
    background: C.bg, color: C.ink,
    fontFamily: 'inherit',
  });

  const label = (txt) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{txt}</div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: C.ink2, margin: 0, lineHeight: 1.5 }}>
        <b>Queremos ayudarte:</b>
      </p>
      <div>
        {label('Nombre y apellido')}
        <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
          placeholder="Ej: María García" style={inputStyle(errors.nombre)} />
        {errors.nombre && <div style={{ fontSize: 11, color: '#E63946', marginTop: 3 }}>{errors.nombre}</div>}
      </div>
      <div>
        {label('E-mail')}
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
          placeholder="tu@email.com" style={inputStyle(errors.email)} />
        {errors.email && <div style={{ fontSize: 11, color: '#E63946', marginTop: 3 }}>{errors.email}</div>}
      </div>
      <div>
        {label('Teléfono (opcional)')}
        <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
          placeholder="Cód. de área + número" style={inputStyle(false)} />
      </div>
      <div>
        {label('Mensaje')}
        <textarea value={form.mensaje} onChange={e => set('mensaje', e.target.value)}
          placeholder="Contanos en qué podemos ayudarte..."
          rows={3}
          style={{ ...inputStyle(errors.mensaje), resize: 'none' }} />
        {errors.mensaje && <div style={{ fontSize: 11, color: '#E63946', marginTop: 3 }}>{errors.mensaje}</div>}
      </div>
      <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{captcha.question}</div>
        <input value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
          placeholder="Pregunta de seguridad" style={{ ...inputStyle(errors.captcha), background: '#fff' }} />
        {errors.captcha && <div style={{ fontSize: 11, color: '#E63946', marginTop: 3 }}>{errors.captcha}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={onBack}
          style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Volver
        </button>
        <button onClick={handleSubmit} disabled={sending}
          style={{ flex: 2, padding: '10px', borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.7 : 1 }}>
          {sending ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </div>
    </div>
  );
}

// ─── Pantalla de agradecimiento ────────────────────────────────
function ThanksScreen({ onClose }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 16, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 4.5 4.5L20 6"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>¡Mensaje enviado!</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Te responderemos a la brevedad por el e-mail que nos dejaste.</div>
      </div>
      <button onClick={onClose}
        style={{ marginTop: 8, padding: '10px 28px', borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Cerrar
      </button>
    </div>
  );
}

// ─── Panel de chat ─────────────────────────────────────────────
function ChatPanel({ onMinimize, isClosing, initialBotMessage }) {
  const initialSuggestions = FAQS.filter(f => TOP_FAQS.includes(f.id));

  // El saludo inicial sólo aparece si el chat arranca "en limpio" (click directo
  // en Cuponix) — si arranca desde un "Saber más", ese texto extendido es lo único
  // que se muestra. ChatPanel se monta una sola vez (ver ChatBot), así que este
  // estado inicial no se vuelve a recalcular al minimizar/reabrir.
  const [messages, setMessages] = useState(() => (
    initialBotMessage
      ? [{ id: 1, from: 'bot', text: initialBotMessage }]
      : [{ id: 0, from: 'bot', text: '¡Hola! Soy Cuponix, tu asistente. Escribí tu consulta o elegí una de las preguntas más frecuentes.' }]
  ));
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showInitial, setShowInitial] = useState(!initialBotMessage);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [filterCat, setFilterCat] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const endRef = useRef(null);
  const typedIdsRef = useRef(new Set());      // ids de mensajes ya "escritos"
  const lastInitialRef = useRef(initialBotMessage || null); // último "Saber más" ya insertado

  // Si el chat ya estaba montado y llega un "Saber más" nuevo (texto distinto
  // al que se usó al abrir por primera vez), lo agrega a la conversación existente.
  useEffect(() => {
    if (initialBotMessage && initialBotMessage !== lastInitialRef.current) {
      lastInitialRef.current = initialBotMessage;
      setShowInitial(false);
      setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: initialBotMessage }]);
    }
  }, [initialBotMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, suggestions]);

  const handleInput = (val) => {
    setInput(val);
    if (val.length >= 10) {
      setShowInitial(false);
      setSuggestions(matchFaqs(val));
    } else {
      setSuggestions([]);
    }
  };

  const selectFaq = (faq) => {
    setShowAllFaqs(false);
    setShowInitial(false);
    setInput('');
    setSuggestions([]);
    // User message first
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: faq.q }]);
    // Bot responds after a short delay
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: faq.a, showLink: true, cat: faq.cat, faqId: faq.id }]);
    }, 350);
  };

  const sendRaw = () => {
    if (!input.trim()) return;
    const matched = matchFaqs(input);
    if (matched.length > 0) return;
    const userText = input;
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: userText }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: 'No encontré una respuesta exacta. Intentá reformular o contactanos por WhatsApp.', showLink: true }]);
    }, 350);
  };

  const activeSuggestions = showInitial ? initialSuggestions : suggestions;

  return (
    <div style={{
      position: 'fixed', bottom: 140, right: 20, zIndex: 9000,
      width: 340, borderRadius: 20, overflow: 'hidden',
      background: '#fff', border: `1px solid ${C.line}`,
      boxShadow: '0 16px 60px rgba(11,16,32,0.2)',
      display: 'flex', flexDirection: 'column',
      maxHeight: '72vh',
      transformOrigin: 'bottom right',
      animation: isClosing
        ? 'chatClose 0.32s cubic-bezier(0.55,0,0.45,1) both'
        : 'chatOpen 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      {/* Header */}
      <div style={{ background: C.primary, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {(showAllFaqs || showContact || showThanks)
          ? (!showThanks && <button onClick={() => { setShowAllFaqs(false); setShowContact(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '0 4px 0 0', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>)
          : <BotAvatar size={38} online />
        }
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {showThanks ? '¡Gracias!' : showContact ? 'Contactar un humano' : showAllFaqs ? 'Preguntas frecuentes' : 'Cuponix'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)' }}>
            {showContact || showThanks ? 'Te respondemos a la brevedad' : showAllFaqs ? (filterCat || 'Todas las categorías') : 'Asistente IA · Respuesta inmediata'}
          </div>
        </div>
        <button onClick={onMinimize} title="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <X size={18} />
        </button>
      </div>

      {showThanks
        ? <ThanksScreen onClose={onMinimize} />
        : showContact
          ? <ContactForm onBack={() => setShowContact(false)} onSent={() => setShowThanks(true)} />
          : showAllFaqs
            ? <FaqFullScreen onBack={() => { setShowAllFaqs(false); setFilterCat(null); }} onSelect={selectFaq} filterCat={filterCat} />
            : <>
                {/* Mensajes */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map(msg => (
                    <Bubble
                      key={msg.id}
                      msg={msg}
                      instant={typedIdsRef.current.has(msg.id)}
                      onSeen={() => typedIdsRef.current.add(msg.id)}
                      onShowFaqs={(cat) => { setFilterCat(cat || null); setShowAllFaqs(true); }}
                    />
                  ))}
                  <div ref={endRef} />
                </div>

                {/* Sugerencias */}
                {activeSuggestions.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 2 }}>
                      {showInitial ? 'Preguntas frecuentes' : 'Seleccioná tu consulta'}
                    </span>
                    {activeSuggestions.map(faq => <SuggestionChip key={faq.id} faq={faq} onClick={selectFaq} />)}
                    {showInitial && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px 4px' }}>
                        <button
                          onClick={() => setShowAllFaqs(true)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: C.primary, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
                        >Ver más preguntas</button>
                        <span style={{ fontSize: 12, color: '#D1D5DB' }}>|</span>
                        <button
                          onClick={() => setShowContact(true)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: C.primary, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
                        >Contactar un humano</button>
                      </div>
                    )}
                  </div>
                )}
              </>
      }

      {/* Input */}
      {!showAllFaqs && !showContact && !showThanks && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.line}`, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendRaw()}
            placeholder="Escribí tu pregunta..."
            style={{
              flex: 1, border: `1px solid ${C.line}`, borderRadius: 10,
              padding: '8px 12px', fontSize: 13, outline: 'none',
              background: C.bg, color: C.ink,
            }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.line}
            autoFocus
          />
          <button
            onClick={sendRaw}
            style={{
              background: C.primary, border: 'none', borderRadius: 10,
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Send size={15} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Círculo minimizado ────────────────────────────────────────
function MinimizedDot({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Abrir asistente"
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9001,
        width: 46, height: 46, borderRadius: '50%', border: 'none',
        background: C.primary, cursor: 'pointer',
        boxShadow: '0 4px 18px rgba(37,69,230,0.38)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'bubbleIn .3s cubic-bezier(.34,1.56,.64,1) both',
        overflow: 'hidden', padding: 0,
        transition: 'transform .2s, box-shadow .2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <img src="/cuponix-mini.svg" alt="Cuponix" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: '50%' }} />
    </button>
  );
}

// ─── Globito de texto con typewriter ─────────────────────────
const BUBBLE_FONT = "'Comic Neue', 'Inter', system-ui, sans-serif";
const BUBBLE_PREFIX = '¡Hola! Soy ';
const BUBBLE_NAME   = 'Cuponix';
const BUBBLE_SUFFIX = '\nAvisame si necesitás ayuda :)';
const BUBBLE_TEXT   = BUBBLE_PREFIX + BUBBLE_NAME + BUBBLE_SUFFIX;

function SpeechBubble({ onDismiss }) {
  const typed = useTypewriter(BUBBLE_TEXT, 35);
  const prefixShown = typed.slice(0, BUBBLE_PREFIX.length);
  const nameShown   = typed.slice(BUBBLE_PREFIX.length, BUBBLE_PREFIX.length + BUBBLE_NAME.length);
  const suffixShown = typed.slice(BUBBLE_PREFIX.length + BUBBLE_NAME.length);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          onDismiss();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed', bottom: 170, right: 24, zIndex: 9003, width: 230,
      background: '#fff', borderRadius: 12,
      border: `1.5px solid ${C.line}`,
      boxShadow: '0 6px 24px rgba(11,16,32,0.12)',
      padding: '10px 14px',
      fontFamily: BUBBLE_FONT, fontSize: 15, fontWeight: 700, color: C.ink,
      whiteSpace: 'pre-line', lineHeight: 1.35,
      animation: 'bubbleIn .35s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      <span style={{ fontFamily: BUBBLE_FONT }}>{prefixShown}</span>
      <span style={{ fontFamily: BUBBLE_FONT, color: C.primary }}>{nameShown}</span>
      <span style={{ fontFamily: BUBBLE_FONT, fontWeight: 400 }}>{suffixShown}</span>
      {/* Caret triangular */}
      <span style={{
        position: 'absolute', bottom: -8, right: 28,
        width: 0, height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: `8px solid #fff`,
      }} />
      <span style={{
        position: 'absolute', bottom: -10, right: 27,
        width: 0, height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `9px solid ${C.line}`,
        zIndex: -1,
      }} />
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', top: -8, right: -8,
          width: 17, height: 17, borderRadius: '50%',
          background: C.primary, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 9, lineHeight: 1,
          fontWeight: 800,
        }}
      >{countdown}</button>
    </div>
  );
}

// ─── Robot (SVG animado / estático) ───────────────────────────
function RobotButton({ open, onClick }) {
  return (
    <div
      onClick={onClick}
      title={open ? 'Cerrar asistente' : 'Abrir asistente'}
      style={{ position: 'fixed', bottom: 20, right: 10, zIndex: 9001, cursor: 'pointer', animation: open ? undefined : 'robotIn .55s cubic-bezier(.34,1.56,.64,1) both' }}
    >
      <iframe
        src={open ? '/cuponix-busy-animated.html' : '/cuponix-base-animated.html'}
        title="Cuponix"
        scrolling="no"
        style={{ width: 140, height: 140, border: 'none', background: 'transparent', display: 'block', pointerEvents: 'none' }}
      />
    </div>
  );
}

// ─── Globito del circulito minimizado (contextual o "sigo por acá") ──
const MINI_DURACION = 10; // segundos que dura abierto el globito

function MiniBubble({ titulo, sub, onSaberMas, onClose, closing, duracion = MINI_DURACION }) {
  const [restante, setRestante] = useState(duracion);
  const [hover, setHover]       = useState(false);
  useEffect(() => {
    if (closing) return;
    const t = setInterval(() => setRestante(r => (r > 1 ? r - 1 : 1)), 1000);
    return () => clearInterval(t);
  }, [closing]);
  return (
    <div style={{
      position: 'fixed', bottom: 74, right: 20, zIndex: 9003, width: 220,
      background: '#fff', borderRadius: 12, border: `1.5px solid ${C.line}`,
      boxShadow: '0 6px 24px rgba(11,16,32,0.14)', padding: '11px 14px',
      fontFamily: BUBBLE_FONT, color: C.ink, lineHeight: 1.35,
      animation: closing ? 'bubbleOut .3s ease both' : 'bubbleIn .35s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      <div style={{ fontFamily: BUBBLE_FONT, fontSize: 15, fontWeight: 700 }}>{titulo}</div>
      {sub && <div style={{ fontFamily: BUBBLE_FONT, fontSize: 15, fontWeight: 400, marginTop: 1 }}>{sub}</div>}
      {onSaberMas && (
        <button onClick={onSaberMas} style={{ marginTop: 6, background: 'none', border: 'none', padding: 0, color: C.primary, fontFamily: BUBBLE_FONT, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Saber más →
        </button>
      )}
      {/* Caret hacia el circulito */}
      <span style={{ position: 'absolute', bottom: -8, right: 16, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '8px solid #fff' }} />
      <span style={{ position: 'absolute', bottom: -10, right: 15, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `9px solid ${C.line}`, zIndex: -1 }} />
      {/* Círculo: muestra la cuenta regresiva y, al pasar el mouse, se convierte en la cruz para cerrar */}
      <button
        onClick={onClose}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ position: 'absolute', top: -8, right: -8, width: 17, height: 17, borderRadius: '50%', background: C.primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: BUBBLE_FONT, fontSize: hover ? 9 : 9.5, fontWeight: 700, lineHeight: 1 }}
      >
        {hover ? '✕' : restante}
      </button>
    </div>
  );
}

// Mensajes contextuales según la pantalla (view) donde está el turista.
// "home" no tiene entrada acá — ahí ya cubre el mensaje de bienvenida "Tsss! sigo por acá!"
// del primer minimizado, y no queremos que los dos globitos se pisen.
const MENSAJES_VIEW = {
  marketplace:          { titulo: 'Tocá cualquier cupón para ver el detalle.', sub: 'La mayoría vienen incluidos en el Gesell PaSS.', extendido: 'En el listado, cada tarjeta es un cupón de un socio. Con el pase, la mayoría ya los tenés incluidos; los de más de $15.000 de ahorro los elegís (uno por día de pase) o los sumás sueltos a mitad de precio. Después los activás cuando estés en el local. ¿Te cuento cómo funciona el pase?' },
  'marketplace-ofertas':{ titulo: 'Tocá cualquier cupón para ver el detalle.', sub: 'La mayoría vienen incluidos en el Gesell PaSS.', extendido: 'En el listado, cada tarjeta es un cupón de un socio. Con el pase, la mayoría ya los tenés incluidos; los PLUS los elegís o los sumás a mitad de precio. Después los activás cuando estés en el local. ¿Te cuento cómo funciona el pase?' },
  ofertas:              { titulo: 'Tocá cualquier cupón para ver el detalle.', sub: 'La mayoría vienen incluidos en el Gesell PaSS.', extendido: 'Cada tarjeta es un cupón de un socio. Con el pase la mayoría ya los tenés incluidos; los PLUS los elegís o los sumás a mitad de precio. Después los activás en el local. ¿Te cuento cómo funciona el pase?' },
  salidas:              { titulo: 'Tocá cualquier cupón para ver el detalle.', sub: 'La mayoría vienen incluidos en el Gesell PaSS.', extendido: 'Cada tarjeta es un cupón de un socio de Salidas. Con el pase la mayoría ya los tenés incluidos; los PLUS los elegís o los sumás a mitad de precio. Después los activás en el local. ¿Te cuento cómo funciona el pase?' },
  'oferta-detail':      { titulo: 'Activá este cupón y mostralo en el local.', sub: 'Con el Gesell PaSS ya lo tenés — o lo sumás suelto.', extendido: 'Cuando estés en el local tocá "Activar" y mostrale la pantalla al comercio. La activación tiene su vigencia, así que activalo recién cuando vayas a consumir. ¿Alguna duda con el pase?' },
  detail:               { titulo: 'Este socio tiene cupones activos.', sub: 'Activalos ahora y usalos en tu visita.', extendido: 'En la ficha del socio vas a ver sus cupones disponibles. Sumá los que te interesen a tu carrito y activalos cuando estés en el lugar. Si es un alojamiento PRO, además puede regalarte el Pase al hospedarte. ¿Te muestro cómo funciona?' },
  socios:               { titulo: 'Este socio tiene cupones activos.', sub: 'Activalos ahora y usalos en tu visita.', extendido: 'En la ficha del socio vas a ver sus cupones disponibles. Sumá los que te interesen a tu carrito y activalos cuando estés en el lugar. ¿Te muestro cómo funciona?' },
};

// ─── Componente principal ─────────────────────────────────────
export default function ChatBot({ view = 'home' }) {
  const [open, setOpen]                   = useState(false);
  const [chatClosing, setChatClosing]     = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [minimized, setMinimized]         = useState(false);
  const [scrolledDown, setScrolledDown]   = useState(false);
  const [miniBubble, setMiniBubble]       = useState(null);   // { titulo, sub, extendido? }
  const [miniClosing, setMiniClosing]     = useState(false);
  const [initialBotMessage, setInitialBotMessage] = useState(null);
  const [everOpened, setEverOpened]       = useState(false); // ChatPanel se monta una sola vez y no se destruye al minimizar
  const scrolledRef = useRef(false);
  const closingRef  = useRef(false);
  const miniTimers  = useRef([]);
  const shownViews  = useRef(new Set());
  const tsssShown   = useRef(false); // "Tsss! sigo por acá!" — sólo la primera vez que se minimiza

  useEffect(() => {
    const handler = () => {
      // Aparece recién al llegar a la mitad del sitio (50% del scroll total).
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY >= scrollable * 0.5 && !scrolledRef.current) {
        scrolledRef.current = true;
        setScrolledDown(true);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Globito aparece 1s después del robot
  useEffect(() => {
    if (!scrolledDown) return;
    const t = setTimeout(() => setBubbleVisible(true), 1000);
    return () => clearTimeout(t);
  }, [scrolledDown]);

  // Muestra un globito del circulito por `duracion` segundos y lo cierra con animación.
  const openMini = useCallback((bubble, duracion = MINI_DURACION) => {
    miniTimers.current.forEach(clearTimeout);
    miniTimers.current = [];
    setMiniClosing(false);
    setMiniBubble({ ...bubble, duracion });
    miniTimers.current.push(setTimeout(() => setMiniClosing(true), duracion * 1000 - 300));
    miniTimers.current.push(setTimeout(() => { setMiniBubble(null); setMiniClosing(false); }, duracion * 1000));
  }, []);

  const closeMini = useCallback(() => {
    miniTimers.current.forEach(clearTimeout);
    miniTimers.current = [];
    setMiniClosing(true);
    setTimeout(() => { setMiniBubble(null); setMiniClosing(false); }, 300);
  }, []);

  // Mensaje contextual según la pantalla (una vez por view por sesión).
  useEffect(() => {
    if (!minimized || open) return;
    const msg = MENSAJES_VIEW[view];
    if (!msg || shownViews.current.has(view)) return;
    shownViews.current.add(view);
    const t = setTimeout(() => openMini(msg), 600);
    return () => clearTimeout(t);
  }, [view, minimized, open, openMini]);

  // Muestra "Tsss! sigo por acá!" la primera vez que Cuponix se minimiza en la sesión,
  // sea cerrando el chat abierto, descartando el globito de bienvenida o al entrar
  // a una sección nueva. Si se dispara por un cambio de sección, esa view queda
  // marcada como "ya mostrada" para que el mensaje contextual no la pise enseguida.
  const triggerTsssOnce = useCallback((currentView) => {
    if (tsssShown.current) return;
    tsssShown.current = true;
    if (currentView) shownViews.current.add(currentView);
    openMini({ titulo: 'Tsss! sigo por acá!', sub: 'Cualquier cosa avisame...' }, 5);
  }, [openMini]);

  const handleMinimize = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setChatClosing(true);
    setTimeout(() => {
      setOpen(false);
      setChatClosing(false);
      setMinimized(true);
      setBubbleVisible(false);
      closingRef.current = false;
      triggerTsssOnce();
    }, 350);
  }, [triggerTsssOnce]);

  const handleOpen = () => {
    setOpen(true);
    setEverOpened(true);
    setChatClosing(false);
    setBubbleVisible(false);
    miniTimers.current.forEach(clearTimeout);
    setMiniBubble(null);
    setMiniClosing(false);
  };

  // Refs espejo de estado, para leer el valor más reciente dentro del efecto de
  // cambio de sección sin tener que declararlos como dependencia (eso dispararía
  // el efecto de nuevo cada vez que el usuario abre/cierra el chat manualmente).
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);
  const minimizedRef = useRef(minimized);
  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);

  // Apenas se entra a una sección que NO es la home, Cuponix se minimiza (si no lo
  // estaba ya) mostrando "Tsss! sigo por acá!". En la home queda grande, como
  // siempre (comportamiento normal disparado por scroll) — si volvía minimizado
  // de otra sección, se restaura acá. No corre en el montaje inicial.
  const firstViewRef = useRef(true);
  useEffect(() => {
    if (firstViewRef.current) { firstViewRef.current = false; return; }
    if (view === 'home') {
      if (minimizedRef.current) setMinimized(false);
      return;
    }
    if (minimizedRef.current) return;
    if (openRef.current) {
      handleMinimize();
    } else {
      setBubbleVisible(false);
      setMinimized(true);
      triggerTsssOnce(view);
    }
  }, [view, handleMinimize, triggerTsssOnce]);

  const saberMas = (extendido) => {
    setInitialBotMessage(extendido);
    setMinimized(false);
    handleOpen();
  };

  const KEYFRAMES = `
    @keyframes bubbleIn {
      from { opacity:0; transform:scale(0.8) translateY(8px); }
      to   { opacity:1; transform:scale(1)   translateY(0); }
    }
    @keyframes bubbleOut {
      from { opacity:1; transform:scale(1)   translateY(0); }
      to   { opacity:0; transform:scale(0.85) translateY(6px); }
    }
    @keyframes robotIn {
      0%   { opacity:0; transform:translateY(48px) scale(0.85); }
      100% { opacity:1; transform:translateY(0)    scale(1); }
    }
    @keyframes chatOpen {
      0%   { opacity:0; transform:scale(0.82) translateY(24px); }
      100% { opacity:1; transform:scale(1)    translateY(0); }
    }
    @keyframes chatClose {
      0%   { opacity:1; transform:scale(1)    translateY(0); }
      100% { opacity:0; transform:scale(0.82) translateY(24px); }
    }
    @keyframes msgIn {
      from { opacity:0; transform:translateY(6px) scale(0.97); }
      to   { opacity:1; transform:translateY(0)   scale(1); }
    }
    @keyframes fadeIn {
      from { opacity:0; }
      to   { opacity:1; }
    }
  `;

  if (!scrolledDown && !minimized) return <style>{KEYFRAMES}</style>;

  const showChat = open || chatClosing;

  // ChatPanel se monta una única vez (la primera vez que se abre) y nunca se
  // destruye — así la conversación (mensajes, typewriter ya visto) sobrevive
  // a minimizar/reabrir. Se oculta con CSS, no desmontando el componente.
  return (
    <>
      <style>{KEYFRAMES}</style>
      {everOpened && (
        <div style={{ display: showChat ? undefined : 'none' }}>
          <ChatPanel isClosing={chatClosing} onMinimize={handleMinimize} initialBotMessage={initialBotMessage} />
        </div>
      )}

      {minimized ? (
        <>
          {miniBubble && (
            <MiniBubble
              titulo={miniBubble.titulo} sub={miniBubble.sub} closing={miniClosing}
              duracion={miniBubble.duracion}
              onSaberMas={miniBubble.extendido ? () => saberMas(miniBubble.extendido) : undefined}
              onClose={closeMini}
            />
          )}
          <MinimizedDot onClick={() => { setMinimized(false); handleOpen(); }} />
        </>
      ) : (
        <>
          {bubbleVisible && !open && !chatClosing && (
            <SpeechBubble onDismiss={() => { setBubbleVisible(false); setMinimized(true); triggerTsssOnce(); }} />
          )}
          <RobotButton
            open={open}
            onClick={() => {
              if (open || chatClosing) { handleMinimize(); }
              else { handleOpen(); }
            }}
          />
        </>
      )}
    </>
  );
}
