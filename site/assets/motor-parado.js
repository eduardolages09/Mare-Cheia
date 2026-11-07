/* site-fabrica — motor dos protótipos, na versão parada (fase de escolha).
   Só o que funciona ao clique: o topo que fica sólido, a barra do telemóvel, o índice do exterior,
   os traços dos quartos, a galeria e as comodidades que se arrastam, e o visor.
   Nada ligado ao scroll: as secções presas, as fotos que entram e saem e o gesto animado entram só
   na proposta escolhida (motor-animado.js), que usa a mesma marcação. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- topo e barra do telemóvel ---------- */
  const topo = $('.topo'), hero = $('.hero'), barra = $('.barra'), fecho = $('.fecho'), folha = $('.hero[data-preso] + [data-folha]');
  const estado = () => {
    // hero preso (varias.py): a página sobe por cima dele, por isso quem conta é a folha que vem a seguir
    const h = folha ? folha.getBoundingClientRect().top : hero ? hero.getBoundingClientRect().bottom : 0;
    topo.classList.toggle('solido', h < 80);
    if (barra) {
      const f = fecho ? fecho.getBoundingClientRect().top < innerHeight * .6 : false;
      barra.classList.toggle('visivel', h < innerHeight * .4 && !f);
    }
  };
  addEventListener('scroll', estado, { passive: true });
  addEventListener('resize', estado);
  estado();

  /* ---------- moldura que se abre: o palco medido, para as faixas acertarem ---------- */
  const mede = () => $$('.g-ma__preso').forEach((p) => {
    p.style.setProperty('--Wpx', `${p.clientWidth}px`);
    p.style.setProperty('--Hpx', `${p.clientHeight}px`);
  });
  mede(); addEventListener('resize', mede);

  /* ---------- exterior (cortina): o índice troca o espaço ---------- */
  $$('[data-ext]').forEach((ext) => {
    const xfs = $$('.xf', ext), esp = $$('.ext__espaco', ext), bts = $$('.ext__indice button', ext), mold = $('.ext__moldura', ext);
    const ini = [];
    xfs.forEach((f, k) => { const e = +f.dataset.e; if (ini[e] === undefined) ini[e] = k; });
    bts.forEach((b, e) => b.addEventListener('click', () => {
      xfs.forEach((f, i) => f.style.setProperty('--a', i <= ini[e] ? '1' : '0'));
      esp.forEach((t, k) => t.classList.toggle('ativo', k === e));
      bts.forEach((x, k) => x.setAttribute('aria-pressed', k === e ? 'true' : 'false'));
      mold.dataset.indice = xfs[ini[e]].dataset.i;
    }));
  });

  /* ---------- quartos (painel): o traço escolhe o quarto e a moldura toma o formato da foto ---------- */
  $$('[data-qp]').forEach((qp) => {
    const fotos = $$('.qp__foto', qp), textos = $$('.qp__quarto', qp), tabs = $$('.qp__linha button', qp), mold = $('.qp__moldura', qp);
    const ini = [];
    fotos.forEach((f, k) => { const q = +f.dataset.q; if (ini[q] === undefined) ini[q] = k; });
    tabs.forEach((b, i) => b.addEventListener('click', () => {
      const nova = fotos[ini[i]];
      fotos.forEach((f) => f.classList.toggle('ativo', f === nova));
      textos.forEach((t, j) => t.classList.toggle('ativo', j === i));
      tabs.forEach((x, j) => x.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
      mold.style.setProperty('--ar', nova.dataset.ar); mold.style.setProperty('--wmax', nova.dataset.w);
      mold.dataset.visor = nova.dataset.serie; mold.dataset.indice = nova.dataset.i;
    }));
  });

  /* ---------- quartos (ecrã inteiro): os separadores escolhem o quarto ---------- */
  $$('[data-qb]').forEach((qb) => {
    const fotos = $$('.qb__foto', qb), textos = $$('.qb__quarto', qb), tabs = $$('.qb__linha button', qb), wcs = $$('.qb__wc', qb), area = $('.qb__fotos', qb);
    const serie = textos.map((t) => $('.qb__ver', t).dataset.visor);
    tabs.forEach((b, i) => b.addEventListener('click', () => {
      tabs.forEach((x, j) => x.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
      [fotos, textos].forEach((l) => l.forEach((el, j) => el.classList.toggle('ativo', j === i)));
      wcs.forEach((w) => w.classList.toggle('ativo', +w.dataset.q === i));
      area.dataset.visor = serie[i];
    }));
  });

  /* ---------- arrastar uma fila (galeria e comodidades); arrastar não abre o visor ---------- */
  let arrastou = false;
  const arrastavel = (pista) => {
    let agarra = null, x0 = 0, s0 = 0;
    pista.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      agarra = e.pointerId; x0 = e.clientX; s0 = pista.scrollLeft; arrastou = false;
    });
    pista.addEventListener('pointermove', (e) => {
      if (agarra === null) return;
      const dx = e.clientX - x0;
      if (!arrastou && Math.abs(dx) > 6) { arrastou = true; pista.classList.add('agarrada'); pista.setPointerCapture(agarra); }
      if (arrastou) pista.scrollLeft = s0 - dx;
    });
    const larga = () => { agarra = null; pista.classList.remove('agarrada'); setTimeout(() => { arrastou = false; }, 0); };
    pista.addEventListener('pointerup', larga);
    pista.addEventListener('pointercancel', larga);
    pista.addEventListener('dragstart', (e) => e.preventDefault());
  };
  $$('.galeria__fila, .comod__pista').forEach(arrastavel);

  /* ---------- galeria: separadores (Tudo + cada divisão) e a barra de progresso da fila ---------- */
  /* filtro da lista de quartos: os separadores mostram só um tipo */
  $$('[data-filtro]').forEach((sec) => {
    const seps = $$('.separadores [role="tab"]', sec), filete = $('.separadores__filete', sec), itens = $$('.ql__q', sec);
    const poeFilete = () => { const b = seps.find((x) => x.getAttribute('aria-selected') === 'true'); if (b && filete) { filete.style.width = b.offsetWidth + 'px'; filete.style.transform = `translateX(${b.offsetLeft}px)`; } };
    seps.forEach((b) => b.addEventListener('click', () => {
      seps.forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
      itens.forEach((q) => { q.hidden = b.dataset.div !== 'tudo' && q.dataset.div !== b.dataset.div; });
      poeFilete();
    }));
    addEventListener('resize', poeFilete); if (document.fonts) document.fonts.ready.then(poeFilete); poeFilete();
  });

  $$('.fotos').forEach((sec) => {
    const fila = $('.galeria__fila', sec), seps = $$('.separadores [role="tab"]', sec), filete = $('.separadores__filete', sec), barraG = $('.galeria__barra i', sec);
    if (!fila) return;
    const poeFilete = () => {
      const b = seps.find((x) => x.getAttribute('aria-selected') === 'true');
      if (!b || !filete) return;
      filete.style.width = b.offsetWidth + 'px'; filete.style.transform = `translateX(${b.offsetLeft}px)`;
    };
    const pinta = () => {
      if (!barraG) return;
      const max = fila.scrollWidth - fila.clientWidth;
      barraG.parentNode.style.visibility = max > 2 ? 'visible' : 'hidden';
      barraG.style.width = max > 0 ? `${(fila.clientWidth / fila.scrollWidth) * 100}%` : '100%';
      barraG.style.left = max > 0 ? `${(fila.scrollLeft / fila.scrollWidth) * 100}%` : '0';
    };
    seps.forEach((b) => b.addEventListener('click', () => {
      seps.forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
      const d = b.dataset.div;
      $$('.gf', fila).forEach((g) => { g.hidden = d !== 'tudo' && g.dataset.div !== d; });
      fila.scrollLeft = 0; poeFilete(); pinta();
    }));
    fila.addEventListener('scroll', pinta, { passive: true });
    addEventListener('resize', () => { poeFilete(); pinta(); });
    if (document.fonts) document.fonts.ready.then(poeFilete);
    addEventListener('load', pinta);
    poeFilete(); pinta();
  });

  /* ---------- visor: abre só o espaço clicado; carrega sempre o original e nunca o mostra maior ---------- */
  const visor = $('#visor');
  const vImg = $('.visor__palco img'), vTit = $('.visor__titulo'), vConta = $('.visor__conta'), vMinis = $('.visor__minis');
  let serie = null, vi = 0, ultimoFoco = null, pedido = 0;
  const pinta = () => {
    const f = serie.fotos[vi], meu = ++pedido;
    vImg.classList.add('troca');
    const im = new Image();
    im.onload = () => {
      if (meu !== pedido) return;
      vImg.src = im.src; vImg.alt = f.alt;
      vImg.style.maxWidth = `min(100%, ${f.w}px)`; vImg.style.maxHeight = `min(100%, ${f.h}px)`;
      requestAnimationFrame(() => vImg.classList.remove('troca'));
    };
    im.src = f.src;
    vConta.textContent = `${vi + 1} / ${serie.fotos.length}`;
    $$('button', vMinis).forEach((b, i) => {
      b.classList.toggle('ativo', i === vi);
      if (i === vi) vMinis.scrollTo({ left: b.parentNode.offsetLeft - (vMinis.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
    });
  };
  const abre = (k, i) => {
    if (arrastou) return;
    serie = window.SERIES[k]; if (!serie || !serie.fotos.length) return;
    vi = Math.min(i || 0, serie.fotos.length - 1); ultimoFoco = document.activeElement;
    vTit.textContent = serie.titulo; vImg.removeAttribute('src');
    vMinis.innerHTML = serie.fotos.map((f, j) => `<li><button type="button" aria-label="${f.leg || 'Fotografia ' + (j + 1)}"><img src="${f.mini}" alt="" decoding="async"></button></li>`).join('');
    $$('button', vMinis).forEach((b, j) => b.addEventListener('click', () => { vi = j; pinta(); }));
    visor.hidden = false; requestAnimationFrame(() => visor.classList.add('aberto'));
    document.body.style.overflow = 'hidden'; document.body.classList.add('com-visor');
    pinta(); $('.visor__fechar').focus();
  };
  const fecha = () => {
    visor.classList.remove('aberto');
    setTimeout(() => { visor.hidden = true; }, 350);
    document.body.style.overflow = ''; document.body.classList.remove('com-visor');
    if (ultimoFoco) ultimoFoco.focus({ preventScroll: true });
  };
  const anda = (d) => { vi = (vi + d + serie.fotos.length) % serie.fotos.length; pinta(); };
  // lê o data-visor e o data-indice no clique: as molduras mudam de foto
  $$('[data-visor]').forEach((b) => {
    const abrir = () => abre(b.dataset.visor, +b.dataset.indice || 0);
    b.addEventListener('click', abrir);
    if (b.getAttribute('role') === 'button') b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
  });
  $('.visor__fechar').addEventListener('click', fecha);
  $('.visor__seta--ant').addEventListener('click', () => anda(-1));
  $('.visor__seta--seg').addEventListener('click', () => anda(1));
  visor.addEventListener('click', (e) => { if (e.target === visor || e.target.classList.contains('visor__palco')) fecha(); });
  addEventListener('keydown', (e) => {
    if (visor.hidden) return;
    if (e.key === 'Escape') fecha();
    if (e.key === 'ArrowLeft') anda(-1);
    if (e.key === 'ArrowRight') anda(1);
  });
  let vx = null;
  $('.visor__palco').addEventListener('touchstart', (e) => { vx = e.touches[0].clientX; }, { passive: true });
  $('.visor__palco').addEventListener('touchend', (e) => {
    if (vx === null) return;
    const dx = e.changedTouches[0].clientX - vx; vx = null;
    if (Math.abs(dx) > 40) anda(dx < 0 ? 1 : -1);
  });
})();
