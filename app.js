(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BRL = (v, d = 2) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const USD = (v, d = 2) => 'US$ ' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const RATE = 5.5; // cotação de exemplo

  // ---------- barra global ----------
  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });

  // ---------- entrada ----------
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // ---------- baixar: versão e plataforma ----------
  const isMac = /Mac/i.test(navigator.platform) || /Macintosh/i.test(navigator.userAgent);
  if (!isMac) $('#platformNote').textContent = 'Disponível só para Mac';
  fetch('/latest.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
    if (!j) return;
    if (j.version) $('#versionLabel').textContent = 'Versão ' + String(j.version).replace(/^v/, '');
    if (j.url) $$('[data-download]').forEach(a => { a.href = j.url; });
  }).catch(() => {});
  $('#year').textContent = new Date().getFullYear();

  // ---------- estado compartilhado ----------
  let masked = false;
  let usd = false;
  let value = 8895.0;

  // ---------- demo principal ----------
  const screen = $('#screen'), tab = $('#tab'), card = $('#card');
  const total = $('#total'), tabVal = $('.tab-val'), bars = $('#bars'), ringArc = $('#ringArc');
  let userTouched = false, open = false, pinned = false, closeT;

  const days = [2,3,0,0,4,5,6,3,2,0,0,5,7,6,4,3,0,0,6,8,5,4,6,0,0,5,7,6,5,3];
  days.forEach(d => {
    const i = document.createElement('i');
    if (!d) i.className = 'z';
    i.dataset.h = d ? 4 + d * 3.6 : 2;
    bars.appendChild(i);
  });
  const growBars = () => $$('i', bars).forEach((i, k) => setTimeout(() => { i.style.height = i.dataset.h + 'px'; }, k * 18));
  const resetBars = () => $$('i', bars).forEach(i => { i.style.height = '2px'; });

  const money = (v, d = 2) => masked ? (usd ? 'US$ ••••••' : 'R$ ••••••') : (usd ? USD(v / RATE, d) : BRL(v, d));

  function paint() {
    total.textContent = money(value);
    tabVal.textContent = masked ? 'R$ ••••' : (usd ? USD(value / RATE, 0) : BRL(value, 0));
    $$('[data-money]').forEach(el => { el.textContent = money(+el.dataset.money); });
    $('#eye').classList.toggle('active', masked);
    $('#eyeHint').textContent = masked ? 'Mostrar valores' : 'Ocultar valores';
    $('#maskText').textContent = masked ? 'R$ ••••••' : BRL(8895);
    $('#maskSwitch').checked = masked;
  }

  function setOpen(v) {
    open = v;
    card.classList.toggle('open', v);
    if (v) growBars(); else resetBars();
  }
  const hoverOn = () => { userTouched = true; clearTimeout(closeT); if (!open) setOpen(true); };
  const hoverOff = () => { clearTimeout(closeT); closeT = setTimeout(() => { if (!pinned) setOpen(false); }, 350); };
  tab.addEventListener('pointerenter', hoverOn);
  tab.addEventListener('pointerleave', hoverOff);
  card.addEventListener('pointerenter', hoverOn);
  card.addEventListener('pointerleave', hoverOff);
  tab.addEventListener('click', () => { userTouched = true; pinned = !pinned; setOpen(true); });

  $('#eye').addEventListener('click', () => { masked = !masked; paint(); });
  $('#maskSwitch').addEventListener('change', (e) => { masked = e.target.checked; paint(); });
  $$('.ib').forEach(b => b.addEventListener('pointerenter', () => {
    $('#eyeHint').textContent = b.id === 'eye' ? (masked ? 'Mostrar valores' : 'Ocultar valores') : b.getAttribute('aria-label');
  }));

  // bordas (demo grande e mini-tela ficam sincronizadas)
  const miniScreen = $('#miniScreen');
  function setEdge(edge, fromBig) {
    $$('#edgeSeg button, #edgeSeg2 button').forEach(x => x.classList.toggle('on', x.dataset.edge === edge));
    miniScreen.dataset.edge = edge;
    if (fromBig !== false) {
      const was = open;
      setOpen(false); pinned = false;
      screen.dataset.edge = edge;
      setTimeout(() => { if (userTouched || was) setOpen(true); }, was ? 450 : 250);
    }
  }
  $$('#edgeSeg button').forEach(b => b.addEventListener('click', () => { userTouched = true; setEdge(b.dataset.edge, true); }));
  $$('#edgeSeg2 button').forEach(b => b.addEventListener('click', () => setEdge(b.dataset.edge, false)));

  // moeda
  $$('#curSeg button').forEach(b => b.addEventListener('click', () => {
    $$('#curSeg button').forEach(x => x.classList.toggle('on', x === b));
    usd = b.dataset.cur === 'usd';
    $('#curVal').textContent = usd ? USD(8895 / RATE) : BRL(8895);
    paint();
  }));

  // valor subindo (simulação) e anel
  ringArc.style.strokeDashoffset = String(94.2 * (1 - 0.46));
  setInterval(() => { value += 0.5; paint(); }, 1200);
  paint();

  // abre sozinho quando a demo aparece, se ninguém mexeu
  new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting && !userTouched) setTimeout(() => { if (!userTouched) setOpen(true); }, 1000);
  }), { threshold: .45 }).observe(screen);

  // relógio
  const clock = $('#clock');
  const tick = () => {
    const d = new Date();
    const wd = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
    const mo = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][d.getMonth()];
    clock.textContent = `${wd} ${d.getDate()} ${mo} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  tick();
  setInterval(tick, 20000);

  // ---------- contadores que sobem ao aparecer ----------
  function countUp(el, to, fmt, then) {
    if (reduce) { el.textContent = fmt(to); if (then) then(); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1900);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step); else if (then) then();
    };
    requestAnimationFrame(step);
  }
  const startOnce = (el, fn, threshold = .5) => {
    let done = false;
    new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting && !done) { done = true; fn(); } }), { threshold }).observe(el);
  };
  const liveNum = $('#liveNum');
  startOnce(liveNum, () => {
    let v = 8895;
    countUp(liveNum, v, BRL, () => setInterval(() => { v += 0.5; liveNum.textContent = BRL(v); }, 1200));
  });
  const rtNum = $('#rtNum'), rtArc = $('#rtArc');
  startOnce(rtNum, () => {
    rtArc.style.strokeDashoffset = String(94.2 * (1 - 0.72));
    let v = 8895;
    countUp(rtNum, v, BRL, () => setInterval(() => { v += 0.5; rtNum.textContent = BRL(v); }, 1200));
  });

  // ---------- calculadora ----------
  const rate = $('#rate'), hours = $('#hours'), lost = $('#lost');
  const out = { month: $('#monthOut'), loss: $('#lossOut'), r: $('#rateOut'), h: $('#hoursOut'), l: $('#lostOut') };
  const shown = { month: 0, loss: 0 };
  const money0 = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  function anim(key, el, to) {
    const from = shown[key];
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 380);
      shown[key] = from + (to - from) * (1 - Math.pow(1 - p, 3));
      el.textContent = money0(shown[key]);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function calc() {
    const r = +rate.value, h = +hours.value, l = +lost.value;
    [rate, hours, lost].forEach(i => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min) * 100) + '%'));
    out.r.textContent = 'R$ ' + r;
    out.h.textContent = h + ' h';
    out.l.textContent = l + '%';
    const month = r * h * 4.33;
    const loss = month * (l / 100) * 12;
    if (reduce) { out.month.textContent = money0(month); out.loss.textContent = money0(loss); }
    else { anim('month', out.month, month); anim('loss', out.loss, loss); }
  }
  [rate, hours, lost].forEach(i => i.addEventListener('input', calc));
  calc();
})();
