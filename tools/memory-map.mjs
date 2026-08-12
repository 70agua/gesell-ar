#!/usr/bin/env node
// Genera tools/memory-map.html — mapa navegable de la memoria de Cuponear.
//
//   node tools/memory-map.mjs [--open]
//
// Lee ~/.claude/projects/-Users-mariano-gesell-ar/memory/ y CLAUDE.md, y escribe
// un HTML autocontenido (sin dependencias, sin red) con el grafo de enlaces,
// el contenido de cada memoria y un panel de salud del sistema.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const MEM_DIR = join(homedir(), '.claude/projects/-Users-mariano-gesell-ar/memory');
const OUT = join(REPO, 'tools/memory-map.html');

// Los prefijos numéricos de los nombres de archivo son los dominios.
const DOMINIOS = {
  hub: { nombre: 'Estado actual (repo)', color: '#495057' },
  '00': { nombre: 'Cómo trabajar con Mariano', color: '#e8590c' },
  '10': { nombre: 'Producto — qué es y por qué', color: '#1971c2' },
  '20': { nombre: 'Implementación — dónde y con qué cuidado', color: '#2f9e44' },
  '__': { nombre: 'Sin clasificar', color: '#868e96' },
};

/** Parser de frontmatter acotado a la forma que usa el sistema de memoria. */
function parseFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { datos: {}, cuerpo: texto };
  const datos = {};
  let claveAnidada = null;
  for (const linea of m[1].split(/\r?\n/)) {
    if (!linea.trim()) continue;
    const anidada = linea.match(/^\s{2,}([\w-]+):\s*(.*)$/);
    if (anidada && claveAnidada) {
      datos[claveAnidada][anidada[1]] = desquote(anidada[2]);
      continue;
    }
    const raiz = linea.match(/^([\w-]+):\s*(.*)$/);
    if (!raiz) continue;
    if (raiz[2].trim() === '') {
      claveAnidada = raiz[1];
      datos[claveAnidada] = {};
    } else {
      claveAnidada = null;
      datos[raiz[1]] = desquote(raiz[2]);
    }
  }
  return { datos, cuerpo: texto.slice(m[0].length) };
}

const desquote = (s) => s.trim().replace(/^["'](.*)["']$/s, '$1');

function ultimoCommitDeCLAUDE() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', 'CLAUDE.md'], {
      cwd: REPO, encoding: 'utf8',
    }).trim() || null;
  } catch { return null; }
}

// ── Leer las memorias ───────────────────────────────────────────────────────
const archivos = readdirSync(MEM_DIR)
  .filter((f) => f.endsWith('.md') && f !== 'MEMORY.md')
  .sort();

const memorias = archivos.map((archivo) => {
  const ruta = join(MEM_DIR, archivo);
  const crudo = readFileSync(ruta, 'utf8');
  const { datos, cuerpo } = parseFrontmatter(crudo);
  const slug = datos.name || basename(archivo, '.md');
  const prefijo = /^\d{2}-/.test(archivo) ? archivo.slice(0, 2) : '__';
  return {
    archivo,
    slug,
    prefijo,
    descripcion: datos.description || '',
    tipo: (datos.metadata && datos.metadata.type) || 'sin tipo',
    cuerpo: cuerpo.trim(),
    enlaces: [...new Set([...cuerpo.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim()))],
    bytes: Buffer.byteLength(crudo),
    modificado: statSync(ruta).mtime.toISOString().slice(0, 10),
  };
});

// ── CLAUDE.md como nodo central ─────────────────────────────────────────────
const claudeMd = readFileSync(join(REPO, 'CLAUDE.md'), 'utf8');
const secciones = [...claudeMd.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
const slugsConocidos = new Set(memorias.map((m) => m.slug));

const hub = {
  archivo: 'CLAUDE.md',
  slug: 'CLAUDE.md',
  prefijo: 'hub',
  descripcion: 'Estado actual del proyecto: arquitectura, tablas, reglas vigentes y convenciones. Siempre en contexto.',
  tipo: 'hub',
  cuerpo: claudeMd,
  // CLAUDE.md "enlaza" a toda memoria cuyo slug menciona en su texto.
  enlaces: memorias.filter((m) => claudeMd.includes(m.slug)).map((m) => m.slug),
  bytes: Buffer.byteLength(claudeMd),
  modificado: ultimoCommitDeCLAUDE() || statSync(join(REPO, 'CLAUDE.md')).mtime.toISOString().slice(0, 10),
  secciones,
};

const nodos = [hub, ...memorias];

// ── Salud del sistema ───────────────────────────────────────────────────────
const entrantes = new Map(nodos.map((n) => [n.slug, 0]));
const rotos = [];
for (const n of nodos) {
  for (const destino of n.enlaces) {
    if (slugsConocidos.has(destino) || destino === 'CLAUDE.md') {
      entrantes.set(destino, (entrantes.get(destino) || 0) + 1);
    } else {
      rotos.push({ desde: n.slug, hacia: destino });
    }
  }
}
const huerfanas = memorias
  .filter((m) => entrantes.get(m.slug) === 0 && m.enlaces.length === 0)
  .map((m) => m.slug);
const sinRutear = memorias
  .filter((m) => !readFileSync(join(MEM_DIR, 'MEMORY.md'), 'utf8').includes(m.archivo))
  .map((m) => m.slug);

const datos = {
  generado: new Date().toISOString(),
  dominios: DOMINIOS,
  nodos: nodos.map((n) => ({ ...n, entrantes: entrantes.get(n.slug) || 0 })),
  salud: {
    total: memorias.length,
    bytes: memorias.reduce((a, m) => a + m.bytes, 0),
    rotos,
    huerfanas,
    sinRutear,
    masVieja: memorias.reduce((a, m) => (!a || m.modificado < a.modificado ? m : a), null)?.modificado,
  },
};

writeFileSync(OUT, plantilla(datos), 'utf8');
console.log(`✓ ${OUT}`);
console.log(`  ${datos.salud.total} memorias · ${(datos.salud.bytes / 1024).toFixed(1)} KB · ` +
  `${rotos.length} enlaces rotos · ${huerfanas.length} huérfanas · ${sinRutear.length} fuera del índice`);

if (process.argv.includes('--open')) execFileSync('open', [OUT]);

// ── Plantilla HTML ──────────────────────────────────────────────────────────
function plantilla(d) {
  const json = JSON.stringify(d).replace(/<\/script/gi, '<\\/script');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mapa de memoria — Cuponear</title>
<style>
:root{
  --bg:#fbfbfa; --panel:#fff; --text:#1b1b1f; --muted:#6b6b76; --border:#e4e4e7;
  --accent:#1971c2; --warn:#e8590c; --ok:#2f9e44; --code:#f1f3f5;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#141416; --panel:#1c1c20; --text:#ececf0; --muted:#9a9aa6; --border:#2e2e35;
  --accent:#4dabf7; --warn:#ff922b; --ok:#51cf66; --code:#26262c;
}}
*{box-sizing:border-box}
body{margin:0;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;
  background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
header{padding:22px 26px 16px;border-bottom:1px solid var(--border);
  display:flex;flex-wrap:wrap;gap:16px;align-items:baseline}
h1{margin:0;font-size:19px;letter-spacing:-.02em}
h1 span{color:var(--muted);font-weight:400}
.meta{color:var(--muted);font-size:12.5px;margin-left:auto;text-align:right}
main{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,460px);gap:0;align-items:start}
@media (max-width:960px){main{grid-template-columns:1fr}}
.izq{padding:20px 26px 60px;min-width:0}
.der{position:sticky;top:0;max-height:100vh;overflow-y:auto;border-left:1px solid var(--border);
  padding:20px 24px 60px;background:var(--panel)}
@media (max-width:960px){.der{position:static;max-height:none;border-left:0;border-top:1px solid var(--border)}}
#buscar{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;
  background:var(--panel);color:var(--text);font-size:14px;margin-bottom:18px}
#buscar:focus{outline:2px solid var(--accent);outline-offset:-1px}
.grupo{margin-bottom:26px}
.grupo h2{font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);
  margin:0 0 10px;display:flex;align-items:center;gap:8px}
.punto{width:9px;height:9px;border-radius:50%;flex:none}
.tarjeta{border:1px solid var(--border);border-left:3px solid var(--c,var(--border));
  background:var(--panel);border-radius:8px;padding:11px 13px;margin-bottom:8px;cursor:pointer;
  transition:border-color .12s,transform .12s}
.tarjeta:hover{border-color:var(--accent);transform:translateX(2px)}
.tarjeta.activa{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 22%,transparent)}
.tarjeta h3{margin:0 0 3px;font-size:13.5px;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.tarjeta p{margin:0;font-size:12.5px;color:var(--muted)}
.chips{margin-top:7px;display:flex;gap:6px;flex-wrap:wrap}
.chip{font-size:10.5px;padding:1px 7px;border-radius:20px;background:var(--code);color:var(--muted)}
svg{width:100%;height:420px;display:block;border:1px solid var(--border);border-radius:10px;
  background:var(--panel);margin-bottom:22px;touch-action:none}
svg line{stroke:var(--border);stroke-width:1.4}
svg line.res{stroke:var(--accent);stroke-width:2.2}
svg circle{cursor:grab;stroke:var(--panel);stroke-width:2}
svg text{font-size:9.5px;fill:var(--muted);pointer-events:none;font-family:ui-monospace,Menlo,monospace}
.salud{border:1px solid var(--border);border-radius:10px;padding:13px 15px;margin-bottom:20px;background:var(--panel)}
.salud h2{margin:0 0 9px;font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)}
.salud ul{margin:6px 0 0;padding-left:18px;font-size:12.5px;color:var(--muted)}
.linea{display:flex;justify-content:space-between;gap:12px;font-size:13px;padding:2px 0}
.bien{color:var(--ok)} .mal{color:var(--warn);font-weight:600}
#detalle h2{font-size:16px;margin:0 0 2px}
#detalle .ruta{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--muted);margin-bottom:14px}
#detalle .cuerpo{font-size:13.5px;line-height:1.62}
#detalle .cuerpo h2{font-size:14px;margin:20px 0 7px;padding-bottom:4px;border-bottom:1px solid var(--border)}
#detalle .cuerpo h3{font-size:13px;margin:15px 0 5px}
#detalle .cuerpo p{margin:0 0 10px}
#detalle .cuerpo ul{padding-left:19px;margin:0 0 10px}
#detalle .cuerpo li{margin-bottom:4px}
#detalle .cuerpo code{background:var(--code);padding:1px 5px;border-radius:4px;
  font-family:ui-monospace,Menlo,monospace;font-size:12px}
#detalle .cuerpo pre{background:var(--code);padding:11px 13px;border-radius:7px;overflow-x:auto;margin:0 0 12px}
#detalle .cuerpo pre code{background:none;padding:0;font-size:11.5px;line-height:1.5}
#detalle .cuerpo table{border-collapse:collapse;width:100%;margin:0 0 12px;font-size:12.5px;display:block;overflow-x:auto}
#detalle .cuerpo th,#detalle .cuerpo td{border:1px solid var(--border);padding:5px 9px;text-align:left;vertical-align:top}
#detalle .cuerpo th{background:var(--code);font-weight:600}
#detalle .cuerpo hr{border:0;border-top:1px solid var(--border);margin:16px 0}
#detalle .cuerpo a{color:var(--accent);text-decoration:none;border-bottom:1px dotted}
#detalle .cuerpo a:hover{border-bottom-style:solid}
.vacio{color:var(--muted);font-size:13.5px;padding:30px 0;text-align:center}
kbd{background:var(--code);border:1px solid var(--border);border-bottom-width:2px;border-radius:4px;
  padding:1px 5px;font-size:11px;font-family:ui-monospace,Menlo,monospace}
</style>
</head>
<body>
<header>
  <h1>Mapa de memoria <span>· Cuponear</span></h1>
  <div class="meta" id="meta"></div>
</header>
<main>
  <div class="izq">
    <svg id="grafo"></svg>
    <input id="buscar" placeholder="Buscar en títulos, descripciones y contenido…" autocomplete="off">
    <div id="lista"></div>
  </div>
  <div class="der">
    <div class="salud" id="salud"></div>
    <div id="detalle"><div class="vacio">Elegí una memoria del grafo o de la lista.</div></div>
  </div>
</main>
<script>
const D = ${json};
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const color = p => (D.dominios[p] || {}).color || 'var(--accent)';

// ── Markdown mínimo: lo justo para lo que usan las memorias ────────────────
function md(src){
  const bloques = [];
  src = src.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, (_,l,c) =>
    '\\u0000B' + (bloques.push('<pre><code>'+esc(c.replace(/\\n$/,''))+'</code></pre>')-1) + '\\u0000');

  const linea = t => esc(t)
    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
    .replace(/\\[\\[([^\\]]+)\\]\\]/g, (_,s) => '<a href="#'+s+'" data-ir="'+s+'">'+s+'</a>')
    .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" data-ir="$2">$1</a>')
    .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\\*([^*]+)\\*/g, '$1<em>$2</em>');

  const out = [];
  const lineas = src.split(/\\n/);
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (!l.trim()) continue;
    if (/^\\u0000B\\d+\\u0000$/.test(l.trim())) { out.push(bloques[+l.trim().slice(2,-1)]); continue; }
    if (/^---+$/.test(l.trim())) { out.push('<hr>'); continue; }
    let h = l.match(/^(#{1,4})\\s+(.*)$/);
    if (h) { const n = Math.min(h[1].length + 1, 4); out.push('<h'+n+'>'+linea(h[2])+'</h'+n+'>'); continue; }
    // tabla
    if (l.trim().startsWith('|') && /^\\s*\\|[\\s:|-]+\\|\\s*$/.test(lineas[i+1] || '')) {
      const cel = r => r.trim().replace(/^\\||\\|$/g,'').split('|').map(c => c.trim());
      let t = '<table><thead><tr>' + cel(l).map(c => '<th>'+linea(c)+'</th>').join('') + '</tr></thead><tbody>';
      i += 2;
      while (i < lineas.length && lineas[i].trim().startsWith('|')) {
        t += '<tr>' + cel(lineas[i]).map(c => '<td>'+linea(c)+'</td>').join('') + '</tr>'; i++;
      }
      i--; out.push(t + '</tbody></table>'); continue;
    }
    // lista
    if (/^\\s*[-*]\\s+/.test(l)) {
      let u = '<ul>';
      while (i < lineas.length && /^\\s*[-*]\\s+/.test(lineas[i])) {
        u += '<li>' + linea(lineas[i].replace(/^\\s*[-*]\\s+/,'')) + '</li>'; i++;
      }
      i--; out.push(u + '</ul>'); continue;
    }
    if (/^\\s*\\d+\\.\\s+/.test(l)) {
      let u = '<ol>';
      while (i < lineas.length && /^\\s*\\d+\\.\\s+/.test(lineas[i])) {
        u += '<li>' + linea(lineas[i].replace(/^\\s*\\d+\\.\\s+/,'')) + '</li>'; i++;
      }
      i--; out.push(u + '</ol>'); continue;
    }
    out.push('<p>' + linea(l) + '</p>');
  }
  return out.join('\\n');
}

// ── Cabecera y panel de salud ──────────────────────────────────────────────
const s = D.salud;
document.getElementById('meta').innerHTML =
  s.total + ' memorias · ' + (s.bytes/1024).toFixed(1) + ' KB<br>generado ' +
  new Date(D.generado).toLocaleString('es-AR', {dateStyle:'medium', timeStyle:'short'});

const fila = (k, v, mal) => '<div class="linea"><span>'+k+'</span><span class="'+(mal?'mal':'bien')+'">'+v+'</span></div>';
document.getElementById('salud').innerHTML = '<h2>Salud del sistema</h2>' +
  fila('Enlaces rotos', s.rotos.length, s.rotos.length > 0) +
  (s.rotos.length ? '<ul>' + s.rotos.map(r => '<li><code>'+esc(r.desde)+'</code> → <code>'+esc(r.hacia)+'</code></li>').join('') + '</ul>' : '') +
  fila('Memorias huérfanas', s.huerfanas.length, s.huerfanas.length > 0) +
  (s.huerfanas.length ? '<ul>' + s.huerfanas.map(x => '<li><code>'+esc(x)+'</code></li>').join('') + '</ul>' : '') +
  fila('Fuera del índice MEMORY.md', s.sinRutear.length, s.sinRutear.length > 0) +
  (s.sinRutear.length ? '<ul>' + s.sinRutear.map(x => '<li><code>'+esc(x)+'</code></li>').join('') + '</ul>' : '') +
  fila('Memoria más antigua', s.masVieja || '—', false);

// ── Lista agrupada ─────────────────────────────────────────────────────────
const lista = document.getElementById('lista');
function pintarLista(filtro){
  const q = (filtro || '').toLowerCase().trim();
  const visibles = D.nodos.filter(n => !q ||
    (n.slug + ' ' + n.descripcion + ' ' + n.cuerpo).toLowerCase().includes(q));
  const porGrupo = {};
  for (const n of visibles) (porGrupo[n.prefijo] = porGrupo[n.prefijo] || []).push(n);

  const orden = ['hub', '00', '10', '20', '__'];
  lista.innerHTML = orden.filter(p => porGrupo[p]).map(p => {
    const titulo = p === 'hub' ? 'Estado actual (repo)' : (D.dominios[p] || {}).nombre || p;
    return '<div class="grupo"><h2><span class="punto" style="background:'+color(p)+'"></span>'+esc(titulo)+'</h2>' +
      porGrupo[p].map(n =>
        '<div class="tarjeta" data-slug="'+esc(n.slug)+'" style="--c:'+color(n.prefijo)+'">' +
        '<h3>'+esc(n.slug)+'</h3><p>'+esc(n.descripcion)+'</p>' +
        '<div class="chips"><span class="chip">'+esc(n.tipo)+'</span>' +
        '<span class="chip">'+n.modificado+'</span>' +
        '<span class="chip">'+(n.bytes/1024).toFixed(1)+' KB</span>' +
        (n.enlaces.length ? '<span class="chip">→ '+n.enlaces.length+'</span>' : '') +
        (n.entrantes ? '<span class="chip">← '+n.entrantes+'</span>' : '') +
        '</div></div>').join('') + '</div>';
  }).join('') || '<div class="vacio">Sin resultados.</div>';
}

// ── Detalle ────────────────────────────────────────────────────────────────
let activo = null;
function abrir(slug){
  const n = D.nodos.find(x => x.slug === slug);
  if (!n) return;
  activo = slug;
  const entran = D.nodos.filter(x => x.enlaces.includes(slug)).map(x => x.slug);
  const rel = (t, arr) => arr.length
    ? '<p style="font-size:12.5px;color:var(--muted)"><strong>'+t+':</strong> ' +
      arr.map(x => '<a href="#'+x+'" data-ir="'+x+'">'+esc(x)+'</a>').join(' · ') + '</p>' : '';
  document.getElementById('detalle').innerHTML =
    '<h2>'+esc(n.slug)+'</h2><div class="ruta">'+esc(n.archivo)+' · '+esc(n.tipo)+
    ' · modificado '+n.modificado+'</div>' +
    rel('Enlaza a', n.enlaces) + rel('Referenciada desde', entran) +
    '<div class="cuerpo">'+md(n.cuerpo)+'</div>';
  document.querySelectorAll('.tarjeta').forEach(t =>
    t.classList.toggle('activa', t.dataset.slug === slug));
  document.querySelectorAll('#grafo circle').forEach(c =>
    c.setAttribute('r', c.dataset.slug === slug ? 11 : c.dataset.r));
  document.querySelectorAll('#grafo line').forEach(l =>
    l.classList.toggle('res', l.dataset.a === slug || l.dataset.b === slug));
  document.querySelector('.der').scrollTop = 0;
}

document.addEventListener('click', e => {
  const ir = e.target.closest('[data-ir]');
  if (ir) {
    const destino = ir.dataset.ir.replace(/\\.md$/, '');
    if (D.nodos.some(n => n.slug === destino || n.archivo === ir.dataset.ir)) {
      e.preventDefault();
      abrir((D.nodos.find(n => n.archivo === ir.dataset.ir) || {}).slug || destino);
    }
    return;
  }
  const t = e.target.closest('.tarjeta');
  if (t) abrir(t.dataset.slug);
});
document.getElementById('buscar').addEventListener('input', e => {
  pintarLista(e.target.value);
  if (activo) document.querySelectorAll('.tarjeta').forEach(t =>
    t.classList.toggle('activa', t.dataset.slug === activo));
});

// ── Grafo dirigido por fuerzas ─────────────────────────────────────────────
(function grafo(){
  const svg = document.getElementById('grafo');
  const W = svg.clientWidth || 900, H = 420;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  const N = D.nodos.map((n, i) => ({
    slug: n.slug, prefijo: n.prefijo,
    r: n.prefijo === 'hub' ? 13 : 5 + Math.min(n.entrantes + n.enlaces.length, 7),
    x: W/2 + Math.cos(i) * 150 + (i % 7) * 11,
    y: H/2 + Math.sin(i) * 110 + (i % 5) * 9,
    vx: 0, vy: 0,
  }));
  const idx = new Map(N.map((n, i) => [n.slug, i]));
  const E = [];
  for (const n of D.nodos)
    for (const dest of n.enlaces)
      if (idx.has(dest)) E.push([idx.get(n.slug), idx.get(dest)]);

  for (let paso = 0; paso < 320; paso++) {
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const a = N[i], b = N[j];
      let dx = b.x - a.x, dy = b.y - a.y, d2 = dx*dx + dy*dy || 1;
      const f = 2600 / d2, d = Math.sqrt(d2);
      const ux = dx/d*f, uy = dy/d*f;
      a.vx -= ux; a.vy -= uy; b.vx += ux; b.vy += uy;
    }
    for (const [i, j] of E) {
      const a = N[i], b = N[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const f = (d - 108) * 0.012;
      a.vx += dx/d*f; a.vy += dy/d*f; b.vx -= dx/d*f; b.vy -= dy/d*f;
    }
    for (const n of N) {
      n.vx += (W/2 - n.x) * 0.0022; n.vy += (H/2 - n.y) * 0.0032;
      n.x += (n.vx *= 0.82); n.y += (n.vy *= 0.82);
      n.x = Math.max(46, Math.min(W - 46, n.x));
      n.y = Math.max(20, Math.min(H - 20, n.y));
    }
  }

  const ns = 'http://www.w3.org/2000/svg';
  const el = (t, attrs) => { const e = document.createElementNS(ns, t);
    for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  const lineas = E.map(([i, j]) => {
    const l = el('line', { x1:N[i].x, y1:N[i].y, x2:N[j].x, y2:N[j].y });
    l.dataset.a = N[i].slug; l.dataset.b = N[j].slug; svg.appendChild(l); return l;
  });
  const circulos = N.map(n => {
    const c = el('circle', { cx:n.x, cy:n.y, r:n.r, fill:color(n.prefijo) });
    c.dataset.slug = n.slug; c.dataset.r = n.r;
    c.appendChild(el('title', {})).textContent = n.slug;
    c.addEventListener('pointerdown', ev => {
      ev.preventDefault(); c.setPointerCapture(ev.pointerId);
      const mover = m => {
        const p = svg.createSVGPoint(); p.x = m.clientX; p.y = m.clientY;
        const q = p.matrixTransform(svg.getScreenCTM().inverse());
        n.x = q.x; n.y = q.y; redibujar();
      };
      const soltar = () => { c.removeEventListener('pointermove', mover);
        c.removeEventListener('pointerup', soltar); };
      c.addEventListener('pointermove', mover); c.addEventListener('pointerup', soltar);
    });
    c.addEventListener('click', () => abrir(n.slug));
    svg.appendChild(c); return c;
  });
  const textos = N.map(n => {
    const t = el('text', { x:n.x, y:n.y - n.r - 5, 'text-anchor':'middle' });
    t.textContent = n.prefijo === 'hub' ? 'CLAUDE.md' : n.slug.replace(/^\\d\\d-/, '');
    svg.appendChild(t); return t;
  });
  function redibujar(){
    E.forEach(([i, j], k) => { const l = lineas[k];
      l.setAttribute('x1', N[i].x); l.setAttribute('y1', N[i].y);
      l.setAttribute('x2', N[j].x); l.setAttribute('y2', N[j].y); });
    N.forEach((n, k) => { circulos[k].setAttribute('cx', n.x); circulos[k].setAttribute('cy', n.y);
      textos[k].setAttribute('x', n.x); textos[k].setAttribute('y', n.y - n.r - 5); });
  }
})();

pintarLista('');
if (location.hash) abrir(decodeURIComponent(location.hash.slice(1)));
</script>
</body>
</html>`;
}
