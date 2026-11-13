/* ========= Utilidades ========= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ========= Estantería ========= */
// Más adelante aquí se podrán añadir libros nuevos (BOOKS.push({...}) + renderShelf()).
const BOOKS = [
  { id: 'carta', title: 'Bajo el cielo azul de nuestro amor', spine: 'Bajo el cielo azul', cover: 'luna' }
];
const overlay = $('#bookOverlay');

function renderShelf() {
  const box = $('#shelfBooks');
  box.innerHTML = '';
  BOOKS.forEach(b => {
    const el = document.createElement('button');
    el.className = 'shelf-book cover-' + b.cover;
    el.title = 'Abrir: ' + b.title;
    const sp = document.createElement('span');
    sp.textContent = b.spine;
    el.appendChild(sp);
    el.onclick = () => openBook(b.id);
    box.appendChild(el);
  });
  const slot = document.createElement('div');
  slot.className = 'shelf-slot';
  slot.title = 'Pronto podrás crear más libros';
  slot.textContent = '+';
  box.appendChild(slot);

  // Decoración del cabinete (no son libros reales)
  ['red', 'green', 'purple', 'pink', 'lean'].forEach(c => {
    const d = document.createElement('div');
    d.className = 'dbook db-' + c;
    box.appendChild(d);
  });
  const sp = document.createElement('div'); sp.className = 'shelf-spacer'; box.appendChild(sp);
  const candles = document.createElement('img');
  candles.className = 'shelf-candles';
  candles.src = 'assets/velas_rosas_azules.png';
  candles.alt = '';
  box.appendChild(candles);
}

/* ========= Estrellas de fondo ========= */
function makeStars(container, n) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    const size = 1 + Math.random() * 3;
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `animation-delay:${(Math.random() * 4).toFixed(2)}s;animation-duration:${(3 + Math.random() * 4).toFixed(2)}s`;
    container.appendChild(s);
  }
}
$$('.stars').forEach(c => makeStars(c, 55));
/* Apertura: el libro aparece cerrado, centrado, y la tapa se abre con calma */
const OPEN_DELAY = 1000;   // pausa mostrando la tapa cerrada
const OPEN_MS = 2200;      // duración de la apertura de la tapa
function openBook() {
  if (busy) return;
  overlay.classList.remove('opened', 'closing');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  show(0);                       // siempre se abre por la portada

  if (noFlip()) { overlay.classList.add('opened'); return; }

  busy = true;
  const A = spreads[0];
  A.classList.add('closed-state');   // oculta la hoja izquierda mientras está cerrado
  overlay.style.setProperty('--open-ms', OPEN_MS + 'ms');

  const leaf = document.createElement('div');
  leaf.className = 'leaf fwd';
  leaf.style.setProperty('--flip', OPEN_MS + 'ms');
  const front = document.createElement('div'); front.className = 'face front';
  front.innerHTML = '<div class="closed-cover"><img src="assets/arreglo_floral_04.png" alt="">' +
    '<h2>Bajo el cielo<em>azul de nuestro amor</em></h2><img src="assets/florecitas_blancas.png" alt="" style="width:16%"></div>';
  const back = document.createElement('div'); back.className = 'face back';
  back.appendChild(cloneHalf($('.left-page', A)));
  leaf.append(front, back);
  leafLayer.appendChild(leaf);
  leaf.getBoundingClientRect();

  setTimeout(() => { overlay.classList.add('opened'); leaf.classList.add('turning'); }, OPEN_DELAY);
  setTimeout(() => {
    leaf.remove();
    A.classList.remove('closed-state');
    busy = false;
  }, OPEN_DELAY + OPEN_MS + 60);
}
function closeBook() {
  if (busy) return;
  overlay.classList.add('closing');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  setTimeout(() => overlay.classList.remove('opened', 'closing'), 550);
}
$('#closeBook').onclick = closeBook;
overlay.addEventListener('click', e => { if (e.target === overlay) closeBook(); });
renderShelf();

/* ========= Navegación con hoja que gira ========= */
const spreads = $$('.spread');
const leafLayer = $('#leafLayer');
let current = 0, busy = false;
const FLIP_MS = 1500;   // pasar página con calma (debe coincidir con --flip en el CSS)
const noFlip = () => matchMedia('(max-width:760px)').matches;   // en móvil no hay giro 3D

// Marca cada hoja como izquierda/derecha y le pone su número
spreads.forEach((s, i) => {
  $$('.half', s).forEach((h, k) => {
    h.classList.add(k === 0 ? 'left-page' : 'right-page');
    const f = document.createElement('span');
    f.className = 'folio';
    f.textContent = i * 2 + k + 1;
    h.appendChild(f);
  });
});

function updateArrows() {
  $('#prev').hidden = current === 0;
  $('#next').hidden = current === spreads.length - 1;
}
function show(i, fade) {
  spreads.forEach((s, k) => {
    s.classList.toggle('active', k === i);
    s.classList.remove('under', 'hide-left', 'hide-right', 'fade');
  });
  if (fade) spreads[i].classList.add('fade');
  current = i;
  updateArrows();
}
function cloneHalf(h) {
  const c = h.cloneNode(true);
  c.removeAttribute('id');
  c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  c.querySelectorAll('canvas').forEach(n => n.remove());
  const src = $$('input', h), dst = $$('input', c);
  src.forEach((s, k) => { if (s.type !== 'file') dst[k].value = s.value; });
  return c;
}
function flip(to) {
  const from = current, fwd = to > from;
  busy = true;
  const A = spreads[from], B = spreads[to];
  const [aL, aR] = $$('.half', A), [bL, bR] = $$('.half', B);

  // La nueva doble página queda debajo; solo se descubre la mitad que la hoja va liberando
  B.classList.add('active', 'under', fwd ? 'hide-left' : 'hide-right');

  const leaf = document.createElement('div');
  leaf.className = 'leaf ' + (fwd ? 'fwd' : 'bwd');
  const front = document.createElement('div'); front.className = 'face front';
  const back = document.createElement('div'); back.className = 'face back';
  front.appendChild(cloneHalf(fwd ? aR : aL));
  back.appendChild(cloneHalf(fwd ? bL : bR));
  leaf.append(front, back);
  // Sombra que la hoja proyecta sobre la página que va descubriendo
  const cast = document.createElement('div');
  cast.className = 'cast ' + (fwd ? 'fwd' : 'bwd');
  leafLayer.append(cast, leaf);
  leaf.getBoundingClientRect();
  requestAnimationFrame(() => leaf.classList.add('turning'));

  setTimeout(() => { leaf.remove(); cast.remove(); show(to); busy = false; }, FLIP_MS + 40);
}
function goTo(i) {
  if (busy || i < 0 || i >= spreads.length || i === current) return;
  if (Math.abs(i - current) === 1 && !noFlip()) flip(i);
  else show(i, true);
}
$('#prev').onclick = () => goTo(current - 1);
$('#next').onclick = () => goTo(current + 1);
document.addEventListener('keydown', e => {
  if (!overlay.classList.contains('open')) return;
  if (e.key === 'Escape') return closeBook();
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'ArrowLeft') goTo(current - 1);
});
$$('[data-next]').forEach(b => b.onclick = () => goTo(current + 1));
$$('[data-goto]').forEach(b => b.onclick = () => goTo(+b.dataset.goto));
updateArrows();

/* ========= Lluvia de flores ========= */
const FLOWERS = ['rosa_azul_abierta_01', 'rosa_azul_abierta_02', 'rosa_azul_capullo_01', 'rosa_azul_capullo_02',
  'rosa_azul_capullo_03', 'florecitas_blancas', 'ramita_azul_hojas', 'ramita_azul_bayas'].map(n => `assets/${n}.png`);
const rand = (a, b) => a + Math.random() * (b - a);

function burst(n = 24) {
  const box = $('#burst');
  const icons = ['💙', '✨', '💫', '🦋'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    if (i % 3 === 0) {
      s.textContent = icons[Math.floor(Math.random() * icons.length)];
    } else {
      const img = document.createElement('img');
      img.src = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
      img.alt = '';
      img.style.width = rand(34, 62) + 'px';
      s.appendChild(img);
    }
    s.style.left = 15 + Math.random() * 70 + '%';
    s.style.top = 30 + Math.random() * 50 + '%';
    box.appendChild(s);
    requestAnimationFrame(() => {
      const dx = (Math.random() - .5) * 280, dy = -80 - Math.random() * 200;
      s.style.transform = `translate(${dx}px,${dy}px) scale(${.8 + Math.random()}) rotate(${Math.random() * 360}deg)`;
      s.style.opacity = 0;
    });
    setTimeout(() => s.remove(), 1700);
  }
}
$('#burstBtn').onclick = () => burst(22);
$$('[data-burst]').forEach(b => b.onclick = () => burst(+b.dataset.burst));

/* ========= Hacer florecer la página: las flores brotan sobre las hojas ========= */
let blooming = false;
function bloom(n = 18) {
  if (blooming) return;
  blooming = true;
  const area = $('#pages').getBoundingClientRect();
  const box = $('#burst');
  for (let i = 0; i < n; i++) {
    const img = document.createElement('img');
    const size = rand(70, 150);
    img.className = 'bloom';
    img.alt = '';
    img.src = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    img.style.cssText = `width:${size}px;left:${area.left + rand(0, area.width - size)}px;top:${area.top + rand(0, area.height - size)}px;` +
      `--rot:${rand(-25, 25).toFixed(1)}deg;animation-delay:${(i * 0.12).toFixed(2)}s`;
    box.appendChild(img);
    setTimeout(() => img.remove(), 6200 + i * 120);
  }
  setTimeout(() => { blooming = false; }, 1800);
  setTimeout(() => burst(10), 900);   // pétalos que acompañan el florecer
}
$$('[data-bloom]').forEach(b => b.onclick = () => bloom(18));

/* ========= Guirnalda de lucecitas cálidas sobre el borde superior del libro ========= */
function buildLights() {
  const box = $('#lights');
  const w = box.clientWidth;
  if (!w) return;
  const NS = 'http://www.w3.org/2000/svg', H = 120, sag = 58;
  const swags = Math.max(2, Math.round(w / 300));
  const sw = w / swags;
  let wire = '', bulbs = '', k = 0;
  for (let s = 0; s < swags; s++) {
    const x0 = s * sw, x1 = x0 + sw, cx = x0 + sw / 2, y0 = 6, cy = y0 + sag * 2;
    wire += `M${x0.toFixed(1)} ${y0} Q${cx.toFixed(1)} ${cy} ${x1.toFixed(1)} ${y0} `;
    const count = Math.max(5, Math.round(sw / 38));
    for (let i = 1; i < count; i++, k++) {
      const t = i / count, u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      const y = u * u * y0 + 2 * u * t * cy + t * t * y0;
      // inclinación del cable en ese punto, para que cada foco cuelgue recto hacia abajo
      bulbs += `<g class="bulb b${k % 3}" transform="translate(${x.toFixed(1)} ${(y + 1).toFixed(1)})">` +
        `<circle class="spill" r="30" fill="url(#lightSpill)"/>` +
        `<rect x="-3" y="0" width="6" height="5.5" rx="1" fill="#6b5430"/>` +
        `<path d="M-5.5 5 Q-7 18 0 21 Q7 18 5.5 5 Z" class="glass"/></g>`;
    }
  }
  box.innerHTML =
    `<svg width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" xmlns="${NS}">` +
    `<defs><radialGradient id="lightSpill"><stop offset="0" stop-color="#ffcf70" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient></defs>` +
    `<path d="${wire}" fill="none" stroke="#2c2012" stroke-width="1.8" stroke-linecap="round"/>${bulbs}</svg>`;
}
buildLights();
addEventListener('resize', buildLights);

/* ========= Promesa secreta y tarjetas ========= */
$('#noteBtn').onclick = () => { $('#noteText').hidden = !$('#noteText').hidden; };

$$('.card').forEach(card => {
  const front = card.querySelector('span').textContent;
  let flipped = false;
  card.onclick = () => {
    flipped = !flipped;
    card.classList.toggle('open', flipped);
    card.querySelector('span').textContent = flipped ? card.dataset.back : front;
  };
});

/* ========= Pareja: al tocar la imagen salen flores y la imagen late ========= */
const couple = $('#couple');
couple.addEventListener('click', () => {
  burst(14);
  couple.classList.remove('pulse');
  void couple.offsetWidth;          // reinicia la animación
  couple.classList.add('pulse');
});