/* site-fabrica — sites com várias casas (varias.py): entradas suaves, calendário e reserva, cortina, chegada de drone e visita à casa. */
(() => {
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- entradas: cada bloco sobe uma vez ao chegar ---------- */
  const vr = $$('.vr');
  if (calmo || !('IntersectionObserver' in window)) vr.forEach((e) => e.classList.add('visto'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    vr.forEach((e) => io.observe(e));
  }

  /* ---------- a foto do hero anda mais devagar do que a página (hero preso: é a cortina, mais abaixo, que a move) ---------- */
  const hf = document.querySelector('.hero__foto');
  const preso = document.querySelector('.hero[data-preso]');
  if (hf && !preso && !calmo) {
    const anda = () => { if (scrollY < innerHeight * 1.2) hf.style.transform = `translate3d(0, ${scrollY * .14}px, 0)`; };
    addEventListener('scroll', anda, { passive: true });
  }

  /* ---------- reserva: calendário próprio; o botão leva ao Booking com a pesquisa feita, neste apartamento ---------- */
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const legivel = (t) => { const [a, m, d] = t.split('-').map(Number); return `${d} ${CURTO[m - 1]} ${a}`; };
  $$('.vd').forEach((f) => {
    const casas = JSON.parse(f.dataset.casas);
    const ir = f.querySelector('.vd__ir'), out = f.querySelector('output'), cal = f.querySelector('.vd__cal');
    const preco = f.querySelector('.vd__preco b'), mais = f.querySelector('[data-passo="1"]'), menos = f.querySelector('[data-passo="-1"]');
    const campos = { in: f.querySelector('[data-campo="in"]'), out: f.querySelector('[data-campo="out"]') };
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
    const minimo = iso(hoje);
    let casa = casas[0], n = Math.min(2, casa.max), ent = '', sai = '', fase = '';
    let ano = hoje.getFullYear(), mes = hoje.getMonth();

    const liga = () => {
      out.textContent = n;
      mais.disabled = n >= casa.max; menos.disabled = n <= 1;
      if (preco && casa.desde) preco.textContent = casa.desde;
      const q = new URLSearchParams({ group_adults: n, group_children: 0, no_rooms: 1, selected_currency: 'EUR' });
      if (ent && sai) { q.set('checkin', ent); q.set('checkout', sai); }
      ir.href = `${f.dataset.url}?${q}#RD${casa.rd}`;
      for (const [k, v] of [['in', ent], ['out', sai]]) {
        campos[k].classList.toggle('cheio', !!v);
        campos[k].classList.toggle('agora', fase === k);
        campos[k].querySelector('b').textContent = v ? legivel(v) : 'Escolher';
      }
    };
    const desenha = () => {
      const primeiro = new Date(ano, mes, 1, 12), dias = new Date(ano, mes + 1, 0).getDate();
      const vazios = (primeiro.getDay() + 6) % 7;   // a semana começa à segunda
      const ant = ano > hoje.getFullYear() || mes > hoje.getMonth();
      let h = `<div class="vd__mes"><button type="button" data-mes="-1" aria-label="Mês anterior"${ant ? '' : ' disabled'}>‹</button><span aria-live="polite">${MESES[mes]} ${ano}</span><button type="button" data-mes="1" aria-label="Mês seguinte">›</button></div><div class="vd__dias">`;
      h += ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<span>${d}</span>`).join('') + '<i></i>'.repeat(vazios);
      for (let d = 1; d <= dias; d++) {
        const t = iso(new Date(ano, mes, d, 12));
        const fora = t < minimo || (fase === 'out' && ent && t <= ent);
        const cl = t === ent || t === sai ? 'ponta' : ent && sai && t > ent && t < sai ? 'entre' : '';
        h += `<button type="button" data-dia="${t}" class="${cl}"${fora ? ' disabled' : ''} aria-label="${d} de ${MESES[mes]}">${d}</button>`;
      }
      cal.innerHTML = `${h}</div>`;
    };
    const abre = (k) => {
      fase = k;
      const t = (k === 'out' ? sai || ent : ent);
      if (t) { const [a, m] = t.split('-').map(Number); ano = a; mes = m - 1; }
      cal.hidden = false; desenha(); liga();
    };
    const fecha = () => { fase = ''; cal.hidden = true; liga(); };
    campos.in.addEventListener('click', () => { if (fase === 'in') fecha(); else abre('in'); });
    campos.out.addEventListener('click', () => { if (fase === 'out') fecha(); else abre(ent ? 'out' : 'in'); });
    cal.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.mes) {
        mes += +b.dataset.mes;
        if (mes < 0) { mes = 11; ano--; } else if (mes > 11) { mes = 0; ano++; }
        return desenha();
      }
      const t = b.dataset.dia;
      if (fase === 'in') { ent = t; if (sai && sai <= ent) sai = ''; fase = 'out'; desenha(); liga(); } else { sai = t; fecha(); }
    });
    $$('[data-passo]', f).forEach((b) => b.addEventListener('click', () => { n = Math.max(1, Math.min(casa.max, n + +b.dataset.passo)); liga(); }));
    $$('input[name="casa"]', f).forEach((r) => r.addEventListener('change', () => { casa = casas[+r.value]; n = Math.min(n, casa.max); liga(); }));
    ir.addEventListener('click', (e) => { if (!ent || !sai) { e.preventDefault(); abre(ent ? 'out' : 'in'); } });   // primeiro as datas
    f.addEventListener('submit', (e) => e.preventDefault());
    liga();
  });

  /* a janela de reserva: abre-se com qualquer [data-reservar]; sem ela, essas ligações vão direitas ao Booking */
  const dlg = document.querySelector('.vdlg');
  if (dlg && dlg.showModal) {
    $$('[data-reservar]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); dlg.showModal(); }));
    dlg.querySelector('.vdlg__x').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* o mapa da costa: os caminhos desenham-se quando ele chega ao ecrã */
  const vks = $$('.vk');
  if (calmo || !('IntersectionObserver' in window)) vks.forEach((e) => e.classList.add('visto'));
  else {
    const ik = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); ik.unobserve(e.target); } }), { threshold: .35 });
    vks.forEach((e) => ik.observe(e));
  }

  const larga = matchMedia('(min-width: 901px) and (min-height: 560px)');
  const ciclos = [];

  const orla = (path, q) => {
    const a = Math.pow(Math.sin(Math.PI * q), .8) * 13.3, x = 50 + (q - .5) * 18;
    path.setAttribute('d', `M0 10C${(x - 27).toFixed(2)} ${(10 - a).toFixed(2)} ${(x + 27).toFixed(2)} ${(10 - a).toFixed(2)} 100 10Z`);
  };

  /* a maré: duas linhas de água que sobem e correm de lado, a de trás adiantada */
  const onda = (a, f1, f2, ph, base) => {
    let d = 'M0 10';
    for (let x = 0; x <= 100; x += 1.25) {
      const y = 10 - a * (base + .3 * Math.sin(6.2832 * (x / f1 + ph)) + .09 * Math.sin(6.2832 * (x / f2 - ph * 1.7)));
      d += `L${x} ${y.toFixed(2)}`;
    }
    return `${d}L100 10Z`;
  };
  const mare = (ps, q) => {
    const a = Math.pow(Math.sin(Math.PI * q), .8) * 8;
    ps[0].setAttribute('d', onda(a * 1.28, 71, 29, q * 1.05 + .12, .72));
    ps[1].setAttribute('d', onda(a, 58, 23, q * .8, .6));
  };

  /* ---------- cortina: a folha seguinte sobe por cima da secção presa; o centro da orla vai à frente, como um pano puxado ---------- */
  if (!calmo) {
    $$('[data-folha]').forEach((folha) => {
      const path = folha.querySelector('.v-bainha path'), so = 'soLargo' in folha.dataset;
      const ondas = folha.dataset.folha === 'mare' ? $$('.v-bainha path', folha) : null;
      const atras = folha.previousElementSibling;
      const presa = atras.matches('[data-preso]') ? atras : null;
      const veu = presa && presa.querySelector('.v-veu');
      const ecra = presa && presa.querySelector('.vp-hero__ecra, .vl-hero__ecra'), ir = presa && presa.querySelector('.vp-hero__ir');
      const foto = presa && presa.querySelector('.hero__foto');
      let ultimo = -1;
      ciclos.push(() => {
        if (so && !larga.matches) return;
        const q = Math.max(0, Math.min(1, 1 - folha.getBoundingClientRect().top / innerHeight));
        if (q === ultimo) return;
        ultimo = q;
        if (ondas) mare(ondas, q); else orla(path, q);
        if (veu) veu.style.opacity = (q * .6).toFixed(3);
        if (foto) foto.style.transform = `translate3d(0, ${(-q * 9).toFixed(2)}%, 0)`;
        if (ecra) { ecra.style.transform = `translate3d(0, ${(-q * 22).toFixed(2)}vh, 0)`; ecra.style.opacity = Math.max(0, 1 - q * 2.4).toFixed(3); }
        if (ir) ir.style.opacity = Math.max(0, 1 - q * 3).toFixed(3);
        if (presa && presa.matches('[data-preso]')) { presa.style.visibility = q >= 1 ? 'hidden' : ''; presa.dataset.tapado = q >= 1 ? '1' : ''; }
      });
    });
  }
  /* ---------- vídeo do hero da landing: só entra quando já corre; pára quando a página o tapa; sem ele fica a primeira imagem ---------- */
  const vid = document.querySelector('.vl-video');
  if (vid && !calmo && !(navigator.connection && navigator.connection.saveData)) {
    vid.src = matchMedia('(max-width: 760px)').matches ? vid.dataset.tm : vid.dataset.pc;
    vid.addEventListener('playing', () => vid.classList.add('pronto'), { once: true });
    const hero = vid.closest('.hero');
    const toca = () => { const p = vid.play(); if (p) p.catch(() => {}); };
    toca();
    let tapado = '';
    ciclos.push(() => {
      const t = hero.dataset.tapado || '';
      if (t === tapado) return;
      tapado = t;
      if (t) vid.pause(); else toca();
    });
  }

  /* ---------- região: a carta aproxima-se de cada lugar e o rumo desenha-se até lá, sempre com o scroll ---------- */
  const vt = document.querySelector('.vt');
  if (vt) {
    const D = JSON.parse(vt.dataset.carta);
    const palco = vt.querySelector('.vt__palco'), carta = vt.querySelector('.vt__carta');
    const rumos = $$('.vt__rumos path', vt), arts = $$('.vt__lugar', vt);
    const pts = $$('.vt__p', vt).map((el) => ({ el, x: +el.dataset.x, y: +el.dataset.y, z: +el.dataset.z || 0, l: el.dataset.l === undefined ? -1 : +el.dataset.l }));
    const alto = matchMedia('(max-width: 900px) and (min-height: 560px)');
    const E = [{ x: D.inicio[0], y: D.inicio[1], z: D.inicio[2] }].concat(D.lugares.map((l) => ({
      x: (l.x + D.casa[0]) / 2, y: (l.y + D.casa[1]) / 2, z: l.z })));
    const lisa = (t) => t * t * (3 - 2 * t);
    const preso01 = (v) => Math.max(0, Math.min(1, v));
    let M = null, antes = '', camada = false;
    const mede = () => {
      const r = vt.getBoundingClientRect(), y0 = scrollY;
      const W = palco.clientWidth, H = palco.clientHeight, w = carta.offsetWidth / D.zmax, h = carta.offsetHeight / D.zmax;
      const ocupa = alto.matches ? parseFloat(getComputedStyle(palco).top) + H : 0;   // ao alto, o meio é o da parte que a faixa da carta deixa livre
      const c = arts.map((a) => { const q = a.getBoundingClientRect(); return q.top + y0 + q.height / 2; });
      pts.forEach((p) => { if (p.l >= 0) p.larg = p.el.lastElementChild.offsetWidth; });
      M = { W, H, w, h, c, topo: r.top + y0, fim: r.bottom + y0, vx: alto.matches ? .5 : .7, meio: (ocupa + innerHeight) / 2 };
      antes = '';
    };
    const pinta = () => {
      if (!M) mede();
      const y = scrollY, vh = innerHeight;
      const perto = y + vh >= M.topo - 200 && y <= M.fim + 200;
      if (perto !== camada) { camada = perto; carta.style.willChange = perto ? 'transform' : ''; }   // camada só enquanto a carta está à vista
      if (!perto) return;
      const mid = y + M.meio;
      const A = [M.c[0] - vh * .95].concat(M.c);
      let i = 0;
      while (i < A.length - 2 && mid > A[i + 1]) i++;
      const t = calmo ? 0 : lisa(preso01((mid - A[i]) / (A[i + 1] - A[i])));
      const a = calmo ? E[0] : E[i], b = calmo ? E[0] : E[i + 1];
      const z = Math.exp(Math.log(a.z) * (1 - t) + Math.log(b.z) * t);
      const fx = a.x + (b.x - a.x) * t, fy = a.y + (b.y - a.y) * t;
      const cw = M.w * z, ch = M.h * z;
      const tx = Math.min(0, Math.max(M.W - cw, M.vx * M.W - fx / 100 * cw));
      const ty = Math.min(0, Math.max(M.H - ch, .5 * M.H - fy / 100 * ch));
      const chave = `${tx.toFixed(1)} ${ty.toFixed(1)} ${z.toFixed(4)} ${mid.toFixed(0)}`;
      if (chave === antes) return;
      antes = chave;
      carta.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${(z / D.zmax).toFixed(5)})`;
      const X = (v) => tx + v / 100 * cw, Y = (v) => ty + v / 100 * ch;
      let ativo = -1, menor = Infinity;
      M.c.forEach((c, k) => { const d = Math.abs(mid - c); if (d < menor) { menor = d; ativo = k; } });
      if (mid < M.c[0] - vh * .42) ativo = -1;
      pts.forEach((p) => {
        p.el.style.transform = `translate3d(${X(p.x).toFixed(1)}px, ${Y(p.y).toFixed(1)}px, 0)`;
        if (p.l >= 0) {
          p.el.classList.toggle('vt__p--esq', X(p.x) + 13 + p.larg > M.W - 8);   // perto da margem, o nome passa para o outro lado
          p.el.classList.toggle('ativo', calmo || p.l === ativo);
          p.el.classList.toggle('ja', calmo || p.l <= ativo);
        } else if (p.z) p.el.classList.toggle('vt__p--longe', z < p.z);
      });
      const cx = X(D.casa[0]), cy = Y(D.casa[1]);
      D.lugares.forEach((l, k) => {
        const x = X(l.x), yy = Y(l.y), dx = x - cx, dy = yy - cy;
        const qx = (cx + x) / 2 - dy * l.curva, qy = (cy + yy) / 2 + dx * l.curva;
        const caminho = `M${cx.toFixed(1)} ${cy.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${yy.toFixed(1)}`;
        const seg = k ? M.c[k] - M.c[k - 1] : vh * .95;
        const f = calmo ? 1 : preso01((mid - (M.c[k] - seg * .62)) / (seg * .5));
        for (const r of [rumos[k * 2], rumos[k * 2 + 1]]) {
          r.setAttribute('d', caminho);
          r.style.strokeDashoffset = (1 - f).toFixed(4);
          r.style.opacity = k === ativo || calmo ? 1 : .34;
        }
      });
    };
    ciclos.push(pinta);
    addEventListener('resize', mede);
    addEventListener('load', () => { mede(); pinta(); });
    $$('img', vt).forEach((im) => { if (!im.complete) im.addEventListener('load', () => { mede(); pinta(); }, { once: true }); });
  }

  const ciclo = () => { for (const f of ciclos) f(); };
  addEventListener('scroll', ciclo, { passive: true });
  addEventListener('resize', ciclo);
  ciclo();

  /* ---------- nome do hero premium: letra a letra, de desfocado para nítido (cada palavra não parte) ---------- */
  const h1 = document.querySelector('.vp-hero__ecra h1');
  if (h1 && !calmo) {
    let i = 0;
    const parte = (no) => [...no.childNodes].forEach((n) => {
      if (n.nodeType === 1) return parte(n);
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { f.append(' '); return; }
        const p = document.createElement('span'); p.className = 'p';
        [...w].forEach((ch) => { const l = document.createElement('span'); l.className = 'l'; l.style.setProperty('--i', i++); l.textContent = ch; p.append(l); });
        f.append(p);
      });
      n.replaceWith(f);
    });
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    parte(h1);
    $$('.l', h1).forEach((l) => l.setAttribute('aria-hidden', 'true'));
  }

  /* ---------- chegada: o voo de drone toca uma vez e pousa na foto do hero; sem vídeo, poupança de dados ou já visto nesta sessão, fica a foto ---------- */
  const hc = document.querySelector('.vp-hero[data-chegada]');
  const drone = hc && hc.querySelector('.vp-drone');
  let visto = false;
  try { visto = sessionStorage.getItem('chegada') === '1'; } catch (e) { /* sem armazenamento: toca sempre */ }
  if (drone && !calmo && !visto && !(navigator.connection && navigator.connection.saveData) && drone.canPlayType('video/mp4')) {
    hc.classList.add('voa');
    drone.src = matchMedia('(max-width: 760px) and (max-aspect-ratio: 1/1)').matches ? drone.dataset.tm : drone.dataset.pc;
    let pousou = false;
    const salta = () => pousa();
    const pousa = () => {
      if (pousou) return;
      pousou = true;
      try { sessionStorage.setItem('chegada', '1'); } catch (e) { /* nada */ }
      hc.classList.add('pousa');
      setTimeout(() => hc.classList.remove('voa'), 1050);   // no pico da luz: a foto acaba de descer e o nome entra quando a luz baixa
      setTimeout(() => { drone.pause(); drone.hidden = true; drone.removeAttribute("src"); drone.load(); hc.classList.remove("pousa"); }, 4200);
      ['wheel', 'touchmove', 'keydown'].forEach((t) => removeEventListener(t, salta));
    };
    drone.addEventListener('timeupdate', () => { if (drone.duration && drone.currentTime > drone.duration - 2.1) pousa(); });
    drone.addEventListener('ended', pousa);
    drone.addEventListener('error', pousa);
    ['wheel', 'touchmove', 'keydown'].forEach((t) => addEventListener(t, salta, { passive: true }));
    const espera = setTimeout(pousa, 3500);   // se não começar a tempo, não se fica à espera
    drone.addEventListener('playing', () => clearTimeout(espera), { once: true });
    const pr = drone.play();
    if (pr) pr.catch(pousa);
  } else if (drone) drone.hidden = true;

  /* ---------- câmara em profundidade (como o hero da Quinta das Donas, sem vídeo de IA): a foto original e o seu mapa de profundidade
     num shader; a câmara anda devagar para o lado e para dentro e volta, em ciclo, e o que está perto mexe mais do que o mar.
     Em repouso (fase 0) desenha a foto tal como está, por isso o voo de drone pousa nela sem salto. Sem WebGL2 ou com movimento reduzido fica a foto. ---------- */
  const c3 = document.querySelector('.vp-3d');
  const h3 = c3 && c3.closest('.vp-hero');
  const gl = c3 && !calmo && c3.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (gl) {
    h3.classList.add('p3d');
    const P = Object.assign({ ciclo: 26, lado: 0.022, dentro: 0.085, sobe: 0.006, pan_tm: 0.07 }, JSON.parse(c3.dataset.p || '{}'));
    const foco = (s) => s.split(/\s+/).map((v) => parseFloat(v) / 100);
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, `#version 300 es
in vec2 a; out vec2 v; void main() { v = vec2(a.x, -a.y) * .5 + .5; gl_Position = vec4(a, 0., 1.); }`));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform sampler2D foto, prof;
uniform vec2 k, o, desl;   // parte visível da foto (cover), canto dela, deslocação do que está perto (unidades da foto)
uniform float esc, aprox;  // zoom geral e aproximação do que está perto
in vec2 v; out vec4 cor;
vec2 em(vec2 p, vec2 c, float L) { return c + (p - c) / (1. + aprox * L) - desl * L; }
void main() {
  vec2 c = o + .5 * k;
  vec2 p = c + (o + v * k - c) / esc;
  float L = 1., ant = 1.;
  for (int i = 0; i <= 44; i++) {
    L = 1. - float(i) / 44.;
    if (textureLod(prof, em(p, c, L), 0.).r >= L) break;
    ant = L;
  }
  float a = L, b = ant;
  for (int j = 0; j < 6; j++) { float m = (a + b) * .5; if (textureLod(prof, em(p, c, m), 0.).r >= m) a = m; else b = m; }
  vec2 dx = dFdx(p), dy = dFdy(p);
  cor = textureGrad(foto, clamp(em(p, c, a), vec2(0.), vec2(1.)), dx, dy);
}`));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { h3.classList.remove('p3d'); console.warn('vp-3d:', gl.getProgramInfoLog(pr)); }
    else {
      gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const la = gl.getAttribLocation(pr, 'a');
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);
      const U = {};
      ['foto', 'prof', 'k', 'o', 'desl', 'esc', 'aprox'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
      const textura = (im, u, mip) => {
        gl.activeTexture(gl.TEXTURE0 + u);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        if (mip) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      const carrega = (src) => new Promise((ok, falha) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = falha; i.src = src; });
      const fontes = location.protocol === 'file:'
        ? new Promise((ok, falha) => { const s = document.createElement('script'); s.src = c3.dataset.js; s.onload = () => ok(window.P3D); s.onerror = falha; document.head.appendChild(s); })
        : Promise.resolve({ foto: c3.dataset.foto, prof: c3.dataset.prof });
      let fw = 1, fh = 1, larg = 0, alt = 0, dpr = Math.min(devicePixelRatio || 1, 2), decorrido = 0, ultimo = null, vivo = true, pedido = 0, lentos = 0;
      const mede = () => {
        const r = c3.getBoundingClientRect();
        larg = r.width; alt = r.height;
        c3.width = Math.round(larg * dpr); c3.height = Math.round(alt * dpr);
        gl.viewport(0, 0, c3.width, c3.height);
      };
      const desenha = (fase) => {
        const ao = alt > larg;
        const [fx, fy] = foco(ao ? P.foco_tm : P.foco);
        const ra = larg / alt, ri = fw / fh;
        const k = ra > ri ? [1, ri / ra] : [ra / ri, 1];
        const s = Math.sin(fase * 2 * Math.PI), e = (1 - Math.cos(fase * 2 * Math.PI)) / 2;   // lado e ida-e-volta, ambos 0 na fase 0
        const pan = ao ? P.pan_tm * s : 0;                                                     // ao alto, a câmara passeia também pelo meio da foto
        const ox = Math.min(Math.max((1 - k[0]) * fx + pan * (1 - k[0]), 0), 1 - k[0]), oy = (1 - k[1]) * fy;
        const lx = P.lado * s * k[0], ly = -P.sobe * e * k[1];
        gl.uniform1i(U.foto, 0); gl.uniform1i(U.prof, 1);
        gl.uniform2f(U.k, k[0], k[1]); gl.uniform2f(U.o, ox, oy); gl.uniform2f(U.desl, lx, ly);
        gl.uniform1f(U.aprox, P.dentro * e);
        gl.uniform1f(U.esc, 1 + (Math.abs(lx) / k[0] * 2.2 + Math.abs(ly) / k[1] * 2.2) + P.dentro * e * .18);   // nunca se vê a borda da foto
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const passo = (agora) => {
        pedido = 0;
        if (!vivo) { ultimo = null; return; }
        const quieto = h3.classList.contains('voa');
        if (!quieto && ultimo !== null) decorrido += Math.min(agora - ultimo, 100);   // o relógio só anda com a câmara à vista e o drone pousado
        ultimo = agora;
        const fase = window.__fase3d != null ? window.__fase3d : (decorrido / 1000 / P.ciclo) % 1;
        const ini = performance.now();
        desenha(quieto ? 0 : fase);
        // máquina fraca: menos píxeis (nunca abaixo de 1)
        if (performance.now() - ini > 12 && ++lentos > 20 && dpr > 1) { dpr = Math.max(1, dpr - .5); lentos = 0; mede(); }
        pedido = requestAnimationFrame(passo);
      };
      fontes.then((f) => Promise.all([carrega(f.foto), carrega(f.prof)])).then(([im, pf]) => {
        fw = im.naturalWidth; fh = im.naturalHeight;
        textura(im, 0, true); textura(pf, 1, false);
        mede();
        desenha(0);
        c3.classList.add('pronto');
        addEventListener('resize', () => { mede(); desenha(0); });
        // o hero está preso e a página tapa-o: pára quando já ficou para trás (ou com o separador escondido)
        const ve = () => { vivo = !document.hidden && scrollY < innerHeight * 1.05; if (vivo && !pedido) pedido = requestAnimationFrame(passo); };
        addEventListener('scroll', ve, { passive: true });
        document.addEventListener('visibilitychange', ve);
        pedido = requestAnimationFrame(passo);
      }).catch(() => h3.classList.remove('p3d'));
    }
  }

  /* ---------- premium: depois do hero, o preço «desde» aparece ao lado do botão de reservar do topo ---------- */
  if (document.querySelector('.topo__preco')) {
    let pedido = 0;
    const poe = () => { pedido = 0; document.body.classList.toggle('preco-on', scrollY > innerHeight * 0.85); };
    addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(poe); }, { passive: true });
    poe();
  }

  /* ---------- a casa divisão a divisão: o fundo toma o tom da divisão que está a meio do ecrã ---------- */
  const vv = document.querySelector('.vv');
  if (vv && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) vv.classList.toggle('escuro', e.target.dataset.tom === 'escuro');
    }), { rootMargin: '-48% 0px -48% 0px' });
    $$('.vv-d', vv).forEach((d) => io2.observe(d));
  }
})();
