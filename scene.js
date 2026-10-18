// Shopping Man — home page animation
// A 32-second loop drawn in SVG:
//   1. Shopping Man pushes his cart down the aisle; groceries hop into it
//   2. He swerves around a sweet old lady with a walker
//   3. New aisle: he zips past a wobbling SALE pyramid and catches the falling can
//   4. He flies up to rescue a kitten from the top shelf
//   5. Finale: rays of light, angels, bowing unicorns and a (generic) pope's blessing
// Runs only while the home page is showing, and pauses when the app is in the background.

(function () {
  const LOOP = 32;
  const W = 400, H = 280, FRONT = 250, BACK = 222;

  /* ---------------- drawing ---------------- */

  const SKIN = '#f1c7a5';

  function shelvesSVG() {
    // Back wall with three shelves of colourful products (fixed pseudo-random layout)
    let s = `<rect x="0" y="0" width="${W}" height="205" fill="#fbf1de"/>`;
    s += `<rect x="0" y="0" width="${W}" height="16" fill="#e9dcc3"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${20 + i * 85}" y="3" width="50" height="6" rx="3" fill="#fffbe6" opacity="0.9"/>`;
    const colors = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#e9c46a', '#8ecae6', '#ff70a6', '#90be6d', '#b5838d', '#ffb703'];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    [90, 140, 190].forEach(by => {
      let x = 6;
      while (x < W - 10) {
        const w = 9 + Math.floor(rnd() * 12), h = 16 + Math.floor(rnd() * 20);
        const c = colors[Math.floor(rnd() * colors.length)];
        s += `<rect x="${x}" y="${by - h}" width="${w}" height="${h}" rx="1.5" fill="${c}"/>`;
        s += `<rect x="${x + 2}" y="${by - h + 4}" width="${w - 4}" height="4" fill="#fff" opacity="0.55"/>`;
        x += w + 2 + Math.floor(rnd() * 3);
      }
      s += `<rect x="0" y="${by}" width="${W}" height="6" fill="#9c6b3f"/><rect x="0" y="${by + 6}" width="${W}" height="2" fill="#6f4a2a"/>`;
    });
    // floor
    s += `<rect x="0" y="198" width="${W}" height="${H - 198}" fill="#e7e1d6"/>`;
    for (let i = -6; i < 16; i++) s += `<line x1="${i * 40}" y1="198" x2="${i * 40 - 60}" y2="${H}" stroke="#d6cfc2" stroke-width="1"/>`;
    [214, 236, 262].forEach(y => { s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#d6cfc2" stroke-width="1"/>`; });
    return s;
  }

  const ITEM = {
    apple: `<circle r="5" fill="#e63946"/><path d="M0 -5 q1 -3 3 -4" stroke="#6b3e1e" stroke-width="1.2" fill="none"/><ellipse cx="3" cy="-7" rx="2.5" ry="1.3" fill="#52b788"/>`,
    bread: `<rect x="-8" y="-4.5" width="16" height="9" rx="4.5" fill="#d9a35b"/><path d="M-4 -3 l2 6 M0 -3 l2 6 M4 -3 l2 6" stroke="#b07a35" stroke-width="1"/>`,
    milk: `<rect x="-4.5" y="-6" width="9" height="13" fill="#fff" stroke="#457b9d" stroke-width="1"/><path d="M-4.5 -6 L0 -10 L4.5 -6 Z" fill="#fff" stroke="#457b9d" stroke-width="1"/><rect x="-4.5" y="-1" width="9" height="4" fill="#457b9d"/>`,
    banana: `<path d="M-8 -2 Q0 8 8 -3 Q0 4 -8 -2 Z" fill="#ffd60a" stroke="#c9a400" stroke-width="0.8"/>`,
    can: `<rect x="-5" y="-6" width="10" height="12" rx="1" fill="#e63946"/><rect x="-5" y="-2" width="10" height="4" fill="#fff"/><ellipse cy="-6" rx="5" ry="1.6" fill="#f08080"/>`,
  };

  function heroSVG() {
    return `
      <g class="h-cape" transform="rotate(0 -8 -62)"><path d="M-9 -62 Q-34 -40 -28 -4 L-8 -12 Z" fill="#d62828"/><path d="M-9 -62 Q-26 -40 -22 -8" stroke="#a4161a" stroke-width="1.5" fill="none"/></g>
      <g class="h-legb"><rect x="-7" y="-30" width="7" height="24" rx="2" fill="#174aa8"/><rect x="-8.5" y="-8" width="10" height="8" rx="2" fill="#c1121f"/></g>
      <g class="h-armb"><rect x="-4" y="-61" width="7" height="22" rx="3.5" fill="#174aa8"/><circle cx="-0.5" cy="-37" r="3.6" fill="${SKIN}"/></g>
      <rect x="-12" y="-65" width="24" height="37" rx="7" fill="#1e5bd8"/>
      <rect x="-12" y="-33" width="24" height="5" fill="#f4c430"/><rect x="-3" y="-34.5" width="6" height="8" rx="1" fill="#e0a800"/>
      <circle cx="1" cy="-52" r="7.5" fill="#f4c430" stroke="#c1121f" stroke-width="1.5"/>
      <text x="1" y="-49.3" font-size="7" font-family="Arial Black, Arial" font-weight="900" fill="#c1121f" text-anchor="middle">SM</text>
      <g class="h-legf"><rect x="0" y="-30" width="7" height="24" rx="2" fill="#1e5bd8"/><rect x="-0.5" y="-8" width="10" height="8" rx="2" fill="#d62828"/></g>
      <rect x="-3" y="-69" width="6" height="6" fill="${SKIN}"/>
      <image href="face.png" x="-12.5" y="-106" width="25" height="39"/>
      <g class="h-armf"><rect x="-1" y="-61" width="7" height="22" rx="3.5" fill="#2368e8"/><circle cx="2.5" cy="-37" r="3.6" fill="${SKIN}"/></g>`;
  }

  function cartSVG() {
    let grid = '';
    for (let x = 18; x <= 50; x += 6) grid += `<line x1="${x}" y1="-38" x2="${x - 2 + (x - 16) * -0.05}" y2="-16" stroke="#9aa5b1" stroke-width="1"/>`;
    return `
      <line x1="0" y1="-47" x2="7" y2="-47" stroke="#5c6670" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="7" y1="-47" x2="12" y2="-37" stroke="#7a8794" stroke-width="2.5"/>
      <g class="c-contents"></g>
      <polygon points="10,-38 58,-38 52,-16 16,-16" fill="rgba(190,205,220,0.35)" stroke="#7a8794" stroke-width="2.5"/>
      ${grid}
      <polyline points="16,-16 14,-8 54,-8" fill="none" stroke="#7a8794" stroke-width="2.5"/>
      <circle cx="19" cy="-4" r="4" fill="#333"/><circle cx="49" cy="-4" r="4" fill="#333"/>`;
  }

  function ladySVG() {
    return `
      <g class="l-bubble" opacity="0"><rect x="-58" y="-86" width="62" height="18" rx="9" fill="#fff" stroke="#555"/><path d="M-12 -68 l4 7 l2 -7 Z" fill="#fff" stroke="#555"/><text x="-27" y="-73.5" font-size="8.5" font-family="Arial" font-weight="700" fill="#333" text-anchor="middle">Young man!</text></g>
      <line x1="-16" y1="0" x2="-16" y2="-27" stroke="#9aa5b1" stroke-width="2.2"/><line x1="-30" y1="0" x2="-30" y2="-27" stroke="#9aa5b1" stroke-width="2.2"/>
      <line x1="-31" y1="-27" x2="-14" y2="-27" stroke="#9aa5b1" stroke-width="2.5"/><circle cx="-30" cy="0" r="2" fill="#555"/><circle cx="-16" cy="0" r="2" fill="#555"/>
      <rect x="-5" y="-6" width="3.5" height="6" fill="#7a5c48"/><rect x="2" y="-6" width="3.5" height="6" fill="#7a5c48"/>
      <polygon points="-12,-4 12,-4 7,-36 -7,-36" fill="#8e5cc8"/>
      <path d="M-6 -32 L-16 -27" stroke="#8e5cc8" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="-16" cy="-27" r="2.4" fill="${SKIN}"/>
      <circle cx="0" cy="-43" r="8" fill="${SKIN}"/>
      <path d="M-8 -45 Q0 -55 8 -45 Q6 -51 0 -52 Q-6 -51 -8 -45 Z" fill="#d9d9d9"/><circle cx="5" cy="-51" r="4.5" fill="#d9d9d9"/>
      <circle cx="-4" cy="-43" r="2.4" fill="none" stroke="#333" stroke-width="0.9"/><circle cx="2" cy="-43" r="2.4" fill="none" stroke="#333" stroke-width="0.9"/>
      <path d="M-3.5 -38.5 q2.5 1.5 4 0" stroke="#a0522d" stroke-width="0.9" fill="none"/>`;
  }

  function pyramidSVG() {
    const can = (x, y) => `<g transform="translate(${x} ${y})">${ITEM.can}</g>`;
    return `
      <rect x="-24" y="-2" width="48" height="4" fill="#a67c52"/>
      <g class="p-stack">${can(-12, -8)}${can(0, -8)}${can(12, -8)}${can(-6, -20)}${can(6, -20)}</g>
      <g class="p-sign"><polygon points="0,-62 5,-52 16,-51 8,-44 10,-33 0,-38 -10,-33 -8,-44 -16,-51 -5,-52" fill="#ffd60a" stroke="#e85d04" stroke-width="1.5"/>
      <text x="0" y="-44" font-size="7.5" font-family="Arial Black, Arial" font-weight="900" fill="#d00000" text-anchor="middle">SALE!</text></g>`;
  }

  function kittenSVG() {
    return `
      <g class="k-bubble" opacity="0"><rect x="-6" y="-38" width="30" height="14" rx="7" fill="#fff" stroke="#555"/><text x="9" y="-28" font-size="8" font-family="Arial" font-weight="700" fill="#333" text-anchor="middle">mew!</text></g>
      <path d="M-8 -6 Q-16 -10 -13 -18" stroke="#f4a259" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="-5" rx="8.5" ry="5" fill="#f4a259"/>
      <circle cx="8" cy="-11" r="5.5" fill="#f4a259"/>
      <polygon points="4,-15 5,-21 8,-16" fill="#f4a259"/><polygon points="9,-16 12,-21 13,-14" fill="#f4a259"/>
      <circle cx="6.5" cy="-11.5" r="0.9" fill="#222"/><circle cx="10" cy="-11.5" r="0.9" fill="#222"/>
      <path d="M7.5 -9 q0.8 0.8 1.6 0" stroke="#222" stroke-width="0.6" fill="none"/>
      <path d="M-4 -3 v3 M4 -3 v3" stroke="#e08a3c" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  function unicornSVG() {
    return `
      <path d="M-22 -32 Q-34 -26 -30 -12" stroke="#ff70a6" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M-22 -30 Q-32 -22 -27 -10" stroke="#8ecae6" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="-16" y="-24" width="5" height="24" rx="2" fill="#f5f5f5" stroke="#ddd"/><rect x="-6" y="-24" width="5" height="24" rx="2" fill="#f5f5f5" stroke="#ddd"/>
      <rect x="6" y="-24" width="5" height="24" rx="2" fill="#f5f5f5" stroke="#ddd"/><rect x="14" y="-24" width="5" height="24" rx="2" fill="#f5f5f5" stroke="#ddd"/>
      <ellipse cx="0" cy="-30" rx="23" ry="12" fill="#fff" stroke="#ddd"/>
      <g class="u-head">
        <polygon points="12,-36 22,-38 26,-58 16,-56" fill="#fff" stroke="#ddd"/>
        <ellipse cx="28" cy="-58" rx="10" ry="6.5" fill="#fff" stroke="#ddd"/>
        <polygon points="27,-63 31,-79 32,-63" fill="#ffd166" stroke="#e0a800" stroke-width="0.8"/>
        <circle cx="29" cy="-60" r="1.2" fill="#222"/>
        <path d="M16 -56 Q10 -50 14 -40" stroke="#c77dff" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M19 -59 Q13 -52 16 -44" stroke="#ffd60a" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`;
  }

  function angelSVG() {
    return `
      <g class="a-wings"><ellipse cx="-12" cy="-22" rx="12" ry="7" fill="#fff" stroke="#bde0fe"/><ellipse cx="12" cy="-22" rx="12" ry="7" fill="#fff" stroke="#bde0fe"/></g>
      <polygon points="-9,0 9,0 5,-26 -5,-26" fill="#fff" stroke="#e0e0e0"/>
      <circle cx="0" cy="-32" r="6.5" fill="${SKIN}"/>
      <path d="M-6 -35 Q0 -41 6 -35" stroke="#ffd166" stroke-width="3" fill="none"/>
      <ellipse cx="0" cy="-43" rx="7" ry="2.2" fill="none" stroke="#ffd60a" stroke-width="2"/>
      <path d="M-2 -30 q2 1.6 4 0" stroke="#a0522d" stroke-width="0.8" fill="none"/>
      <path d="M-5 -16 l-8 -6 M5 -16 l8 -6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  }

  // A generic cartoon pope (white robes, mitre and staff) — not a likeness of anyone.
  function popeSVG() {
    return `
      <line x1="-15" y1="0" x2="-15" y2="-84" stroke="#d4a017" stroke-width="2.5"/>
      <path d="M-15 -84 q0 -8 7 -8 q6 0 5 6" stroke="#d4a017" stroke-width="2.5" fill="none"/>
      <polygon points="-13,0 13,0 9,-50 -9,-50" fill="#fff" stroke="#e0e0e0"/>
      <rect x="-2" y="-50" width="4" height="48" fill="#d4a017" opacity="0.85"/>
      <path d="M-11 -50 Q0 -38 11 -50" fill="#fff" stroke="#e0e0e0"/>
      <path d="M-9 -46 L-15 -40" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="-15" cy="-40" r="2.6" fill="${SKIN}"/>
      <circle cx="0" cy="-57" r="7.5" fill="${SKIN}"/>
      <circle cx="-2.8" cy="-58" r="0.9" fill="#333"/><circle cx="2.2" cy="-58" r="0.9" fill="#333"/>
      <path d="M-3 -54 q2.5 2 5 0" stroke="#a0522d" stroke-width="0.9" fill="none"/>
      <polygon points="-7,-63 7,-63 5,-78 0,-85 -5,-78" fill="#fff" stroke="#d4a017" stroke-width="1"/>
      <path d="M0 -84 V-64 M-4 -72 H4" stroke="#d4a017" stroke-width="1.5"/>
      <g class="po-arm"><path d="M8 -46 L14 -56" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="14.5" cy="-57" r="2.6" fill="${SKIN}"/></g>`;
  }

  const heart = `<path d="M0 3 C-6 -2 -4 -7 0 -4 C4 -7 6 -2 0 3 Z" fill="#ff4d6d"/>`;
  const sparkle = `<path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#fff6a5"/>`;

  function build(container) {
    const flying = ['apple', 'bread', 'milk', 'banana'].map((k, i) =>
      `<g id="sm-fly${i}" opacity="0">${ITEM[k]}</g>`).join('');
    container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Shopping Man animation">
      <defs>
        <linearGradient id="sm-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7b0" stop-opacity="0.95"/><stop offset="1" stop-color="#fff7b0" stop-opacity="0"/></linearGradient>
      </defs>
      <g id="sm-world">
        ${shelvesSVG()}
        <g id="sm-rays" opacity="0">
          <polygon points="170,-10 230,-10 340,${H} 60,${H}" fill="url(#sm-ray)"/>
          <polygon points="190,-10 210,-10 250,${H} 150,${H}" fill="#fffbe0" opacity="0.5"/>
        </g>
        <g id="sm-pyramid" opacity="0">${pyramidSVG()}</g>
        <g id="sm-topcan" opacity="0">${ITEM.can}</g>
        <g id="sm-uniL" opacity="0">${unicornSVG()}</g>
        <g id="sm-uniR" opacity="0">${unicornSVG()}</g>
        <g id="sm-lady">${ladySVG()}</g>
        <g id="sm-cart">${cartSVG()}</g>
        <g id="sm-pope" opacity="0">${popeSVG()}</g>
        <g id="sm-hero">${heroSVG()}</g>
        <g id="sm-kitten" opacity="0">${kittenSVG()}</g>
        ${flying}
        <g id="sm-hearts" opacity="0">
          <g transform="translate(-8 0)">${heart}</g><g transform="translate(6 -8) scale(0.8)">${heart}</g><g transform="translate(-2 -16) scale(0.6)">${heart}</g>
        </g>
        <g id="sm-angelL" opacity="0">${angelSVG()}</g>
        <g id="sm-angelR" opacity="0">${angelSVG()}</g>
        <g id="sm-sparkles" opacity="0">
          ${[[250, 140], [275, 120], [300, 150], [140, 120], [180, 100], [215, 130], [100, 80], [320, 90]].map(([x, y], i) =>
            `<g transform="translate(${x} ${y})" class="sp" data-i="${i}">${sparkle}</g>`).join('')}
        </g>
        <g id="sm-banner" opacity="0">
          <text x="${W / 2}" y="40" font-size="24" font-family="Arial Black, Impact, Arial" font-weight="900" text-anchor="middle"
            fill="#ffd60a" stroke="#9d0208" stroke-width="1.5" paint-order="stroke">BLESSED BE</text>
          <text x="${W / 2}" y="66" font-size="24" font-family="Arial Black, Impact, Arial" font-weight="900" text-anchor="middle"
            fill="#ffd60a" stroke="#9d0208" stroke-width="1.5" paint-order="stroke">THE GROCERIES!</text>
        </g>
      </g>
    </svg>`;
  }

  /* ---------------- animation helpers ---------------- */

  const ease = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const lerp = (a, b, p) => a + (b - a) * p;
  const clamp01 = p => Math.max(0, Math.min(1, p));
  // Keyframe track: [[time, value], ...]; eases between frames.
  function track(t, frames, linear) {
    if (t <= frames[0][0]) return frames[0][1];
    for (let i = 1; i < frames.length; i++) {
      const [t1, v1] = frames[i], [t0, v0] = frames[i - 1];
      if (t <= t1) { const p = (t - t0) / Math.max(1e-6, t1 - t0); return lerp(v0, v1, linear ? p : ease(p)); }
    }
    return frames[frames.length - 1][1];
  }
  const between = (t, a, b) => t >= a && t < b;
  function place(el, x, y, s = 1, r = 0, o = null, sx = null) {
    el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${(sx ?? s).toFixed(3)} ${s.toFixed(3)})`);
    if (o !== null) el.setAttribute('opacity', Math.max(0, Math.min(1, o)).toFixed(3));
  }
  const rot = (el, a, cx, cy) => el.setAttribute('transform', `rotate(${a.toFixed(2)} ${cx} ${cy})`);

  /* ---------------- choreography ---------------- */

  const HX = [[0, -90], [6, 150], [6.8, 190], [7.6, 255], [8.5, 300], [10, 470], [10.01, -90], [13, 165], [14.5, 300],
              [16.3, 300], [16.6, 302], [18, 316], [18.6, 316], [20, 290], [21, 300], [23, 150], [LOOP, 150]];
  const HY = [[0, FRONT], [6.2, FRONT], [6.9, BACK - 6], [7.5, BACK - 6], [8.4, FRONT], [16.4, FRONT], [18, 150], [18.6, 150], [20, FRONT], [LOOP, FRONT]];
  const HS = [[0, 0.9], [6.2, 0.9], [6.9, 0.72], [7.5, 0.72], [8.4, 0.9], [LOOP, 0.9]];
  const HR = [[0, 0], [16.4, 0], [17, -18], [18, -18], [18.6, 0], [LOOP, 0]];
  const CART_DX = 14;
  const attached = t => t < 16.3 || t >= 21;
  const PARK_X = 300 + CART_DX * 0.9;
  const FLY = [ // shelf items hopping into the cart: [shelfX, shelfY, launch time, basket slot x]
    [60, 82, 3.2, 22], [110, 132, 4.2, 30], [150, 82, 5.0, 38], [185, 182, 5.6, 46]];
  const SLOT_Y = -40;

  function heroAt(t) {
    return { x: track(t, HX), y: track(t, HY), s: track(t, HS), r: track(t, HR) };
  }
  function cartAt(t) {
    if (attached(t)) { const h = heroAt(t); return { x: h.x + CART_DX * h.s, y: h.y, s: h.s }; }
    return { x: PARK_X, y: FRONT, s: 0.9 };
  }

  let els = null;
  function grab(container) {
    const q = id => container.querySelector('#' + id);
    els = {
      world: q('sm-world'), hero: q('sm-hero'), cart: q('sm-cart'), lady: q('sm-lady'), pyramid: q('sm-pyramid'),
      topcan: q('sm-topcan'), kitten: q('sm-kitten'), hearts: q('sm-hearts'), rays: q('sm-rays'),
      uniL: q('sm-uniL'), uniR: q('sm-uniR'), angelL: q('sm-angelL'), angelR: q('sm-angelR'), pope: q('sm-pope'),
      sparkles: q('sm-sparkles'), banner: q('sm-banner'),
      fly: [0, 1, 2, 3].map(i => q('sm-fly' + i)),
      cape: container.querySelector('.h-cape'), legb: container.querySelector('.h-legb'), legf: container.querySelector('.h-legf'),
      armb: container.querySelector('.h-armb'), armf: container.querySelector('.h-armf'),
      contents: container.querySelector('.c-contents'),
      ladyBubble: container.querySelector('.l-bubble'), kBubble: container.querySelector('.k-bubble'),
      pStack: container.querySelector('.p-stack'), pSign: container.querySelector('.p-sign'),
      uHeadL: container.querySelector('#sm-uniL .u-head'), uHeadR: container.querySelector('#sm-uniR .u-head'),
      wingsL: container.querySelector('#sm-angelL .a-wings'), wingsR: container.querySelector('#sm-angelR .a-wings'),
      popeArm: container.querySelector('.po-arm'),
      sp: [...container.querySelectorAll('#sm-sparkles .sp')],
    };
    // basket contents (hidden until caught)
    const kinds = ['apple', 'bread', 'milk', 'banana'];
    els.contents.innerHTML = kinds.map((k, i) =>
      `<g class="bi" opacity="0" transform="translate(${FLY[i][3]} ${SLOT_Y})">${ITEM[k]}</g>`).join('') +
      `<g class="bi" opacity="0" transform="translate(52 ${SLOT_Y - 1})">${ITEM.can}</g>`;
    els.basket = [...els.contents.querySelectorAll('.bi')];
  }

  function render(t) {
    const E = els;
    const h = heroAt(t), c = cartAt(t);
    const hPrev = heroAt(Math.max(0, t - 0.05));
    const moving = Math.abs(h.x - hPrev.x) > 0.3;
    const airborne = between(t, 16.5, 19.9);

    // global fade at loop end/start
    E.world.setAttribute('opacity', (t > LOOP - 0.8 ? (LOOP - t) / 0.8 : t < 0.4 ? t / 0.4 : 1).toFixed(3));

    // hero
    place(E.hero, h.x, h.y, h.s, h.r);
    const swing = airborne ? 0 : moving ? Math.sin(h.x * 0.16) * 24 : 0;
    rot(E.legf, airborne ? 25 : swing, 3, -30);
    rot(E.legb, airborne ? 35 : -swing, -3, -30);
    rot(E.cape, Math.sin(t * 9) * 6 + (airborne ? 55 : moving ? 18 : 4), -8, -62);
    let af, ab;
    if (airborne) { af = -165; ab = -30; }
    else if (attached(t) && t < 24) { af = -72; ab = -66; }
    else if (between(t, 19.9, 21)) { af = -95; ab = -20; }
    else { af = track(t, [[24, -72], [24.8, -168]]); ab = -66; }
    rot(E.armf, af, 2, -59); rot(E.armb, ab, 0, -59);

    // cart + contents
    place(E.cart, c.x, c.y, c.s);
    E.basket.forEach((b, i) => {
      const land = i < 4 ? FLY[i][2] + 0.6 : 14.2;
      b.setAttribute('opacity', t >= land ? 1 : 0);
    });

    // flying groceries
    FLY.forEach(([sx, sy, t0, slot], i) => {
      const el = E.fly[i];
      if (!between(t, t0, t0 + 0.6)) { el.setAttribute('opacity', 0); return; }
      const p = (t - t0) / 0.6, cc = cartAt(t);
      const tx = cc.x + slot * cc.s, ty = cc.y + SLOT_Y * cc.s;
      place(el, lerp(sx, tx, p), lerp(sy, ty, p) - Math.sin(p * Math.PI) * 30, 1, p * 360, 1);
    });

    // old lady (drawn in front of Shopping Man while he swerves behind her)
    const inBack = between(t, 6.4, 8.3);
    if (inBack !== E.ladyFront) {
      E.ladyFront = inBack;
      const parent = E.lady.parentNode;
      if (inBack) parent.insertBefore(E.lady, E.kitten); else parent.insertBefore(E.lady, E.cart);
    }
    const lx = track(t, [[0, 470], [3, 470], [11, -60]], true);
    place(E.lady, lx, FRONT + Math.sin(t * 8) * 0.8, 0.9, 0);
    E.ladyBubble.setAttribute('opacity', between(t, 6.5, 8.6) ? 1 : 0);

    // sale pyramid (back lane) + falling top can
    const pyO = track(t, [[9.8, 0], [10.3, 1], [16, 1], [16.6, 0]]);
    const wob = between(t, 12.4, 14.8) ? Math.sin((t - 12.4) * 14) * 7 * (1 - (t - 12.4) / 2.4) : 0;
    place(E.pyramid, 250, BACK, 1.1, 0, pyO);
    rot(E.pStack, wob, 0, 0);
    E.pSign.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * 5)) * 3).toFixed(2)})`);
    if (t < 13.5) place(E.topcan, 250 + wob * 0.8, BACK - 32 * 1.1, 1.1, wob, pyO);
    else if (t < 14.2) {
      const p = (t - 13.5) / 0.7, cc = cartAt(t);
      place(E.topcan, lerp(250, cc.x + 52 * cc.s, p), lerp(BACK - 35, cc.y + (SLOT_Y - 1) * cc.s, p) - Math.sin(p * Math.PI) * 26, 1, p * 540, 1);
    } else E.topcan.setAttribute('opacity', 0);

    // kitten: top shelf -> carried -> cart
    if (t < 13.8) E.kitten.setAttribute('opacity', 0);
    else if (t < 18.3) place(E.kitten, 334, 90, 1, 0, clamp01((t - 13.8) / 0.4));
    else if (t < 20) place(E.kitten, h.x + 4 * h.s, h.y - 98 * h.s, 0.9, 0, 1);
    else { const cc = cartAt(t); place(E.kitten, cc.x + 28 * cc.s, cc.y - 36 * cc.s, 0.8, 0, 1); }
    E.kBubble.setAttribute('opacity', between(t, 14.3, 17.2) ? 1 : 0);
    if (between(t, 19.6, 21.6)) {
      const p = (t - 19.6) / 2, cc = cartAt(t);
      place(E.hearts, cc.x + 36, cc.y - 50 - p * 30, 1, 0, 1 - p);
    } else E.hearts.setAttribute('opacity', 0);

    // finale
    E.rays.setAttribute('opacity', track(t, [[21.5, 0], [23, 0.85], [LOOP, 0.85]]).toFixed(3));
    const ay = track(t, [[21.8, -70], [24, 132]]);
    place(E.angelL, 48, ay + Math.sin(t * 2.2) * 4, 1, 0, t > 21.8 ? 1 : 0);
    place(E.angelR, 352, ay + Math.sin(t * 2.2 + 1.5) * 4, 1, 0, t > 21.8 ? 1 : 0);
    const flap = 1 + Math.sin(t * 11) * 0.15;
    E.wingsL.setAttribute('transform', `scale(${flap} 1)`); E.wingsR.setAttribute('transform', `scale(${flap} 1)`);
    place(E.uniL, track(t, [[22, -70], [24.5, 40]]), FRONT, 0.8, 0, t > 22 ? 1 : 0);
    place(E.uniR, track(t, [[22, 480], [24.5, 368]]), FRONT - 6, 0.8, 0, t > 22 ? 1 : 0, -0.8);
    const bow = track(t, [[24.8, 0], [25.8, 42]]);
    rot(E.uHeadL, bow, 14, -34); rot(E.uHeadR, bow, 14, -34);
    place(E.pope, track(t, [[22.2, 470], [24.6, 292]]), FRONT - 2, 1, 0, t > 22.2 ? 1 : 0);
    rot(E.popeArm, track(t, [[25.2, 40], [26, -15]]) + (t > 26 ? Math.sin(t * 4) * 8 : 0), 8, -46);
    const spO = track(t, [[25.8, 0], [26.4, 1], [LOOP, 1]]);
    E.sparkles.setAttribute('opacity', spO.toFixed(3));
    E.sp.forEach((g, i) => {
      const [x, y] = g.getAttribute('transform').match(/-?[\d.]+/g).slice(0, 2);
      const sc = 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i));
      g.setAttribute('transform', `translate(${x} ${y}) scale(${sc.toFixed(2)})`);
    });
    const bp = clamp01((t - 26.2) / 0.6);
    E.banner.setAttribute('opacity', bp.toFixed(3));
    E.banner.setAttribute('transform', `translate(${W / 2} 50) scale(${(0.6 + 0.4 * ease(bp) + Math.sin(t * 3) * 0.02).toFixed(3)}) translate(${-W / 2} -50)`);
  }

  /* ---------------- run loop ---------------- */

  let clock = 0, last = 0, raf = 0, running = false, built = null;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    if (!running) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    clock = (clock + dt) % LOOP;
    render(clock);
    raf = requestAnimationFrame(frame);
  }

  window.SMScene = {
    mount(container) {
      if (built === container) return;
      build(container); grab(container); built = container;
      render(reduced ? 28 : 0);
    },
    start() {
      if (!els || running || reduced || document.hidden) return;
      running = true; last = 0; raf = requestAnimationFrame(frame);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    seek(t) { if (els) { clock = t % LOOP; render(clock); } },   // for testing
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.SMScene.stop();
    else if (document.getElementById('voice-screen')?.classList.contains('active')) window.SMScene.start();
  });
})();
