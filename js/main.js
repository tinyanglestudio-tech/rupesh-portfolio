/* ═══════════════════════════════════════════════════════════
   TinyAngle Studio — Shared JavaScript
   ═══════════════════════════════════════════════════════════ */

/* ── Scroll Reveal ─────────────────────────────────────────── */
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); } });
  }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rev, .rev-left, .rev-right').forEach(el => obs.observe(el));
}

/* ── Stats Counter ─────────────────────────────────────────── */
function setupStats() {
  var cells = document.querySelectorAll('.stat-cell');
  if (!cells.length) return;

  /* Immediately make cells visible with their correct fallback values.
     This guarantees counters never show "0" even if the observer or
     animation fails (slow device, mobile Safari timing, hard reload). */
  cells.forEach(function(c) {
    var n = c.querySelector('.stat-num');
    if (n && n.dataset.to) n.textContent = n.dataset.to;
  });

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting || e.target.dataset.animated) return;
      var el = e.target;
      el.dataset.animated = '1';
      el.classList.add('vis');
      var n = el.querySelector('.stat-num');
      if (n && n.dataset.to) {
        var to = parseInt(n.dataset.to, 10);
        if (!isNaN(to)) {
          n.textContent = '0'; /* reset to 0 just before animating */
          countUp(n, to, 1400);
        }
      }
      obs.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px 80px 0px' });

  cells.forEach(function(c, i) {
    c.style.transitionDelay = (i * 0.1) + 's';
    obs.observe(c);
  });

  /* Belt-and-suspenders: if the observer hasn't fired after 2.5 s
     (e.g. user never scrolled, iOS quirk, hidden tab), show final values
     and make cells visible. */
  setTimeout(function() {
    cells.forEach(function(c) {
      if (!c.dataset.animated) {
        c.dataset.animated = '1';
        c.classList.add('vis');
        var n = c.querySelector('.stat-num');
        if (n && n.dataset.to) n.textContent = n.dataset.to;
      }
    });
  }, 2500);
}

function countUp(el, to, dur) {
  var start = performance.now();
  function tick(now) {
    var p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * to);
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = to; /* guarantee exact final value */
    }
  }
  requestAnimationFrame(tick);
}

/* ── Ecosystem Counter Update (belt-and-suspenders for index.html) ── */
function updateEcosystemCounts() {
  if (typeof PROJECTS === 'undefined' || typeof CATEGORIES === 'undefined' || typeof STATUS_LABEL === 'undefined') return;
  var allIds = ['product', 'client', 'innovation'].reduce(function(acc, k) {
    return acc.concat((CATEGORIES[k] && CATEGORIES[k].ids) || []);
  }, []);
  var live = 0, dev = 0, cpt = 0;
  allIds.forEach(function(id) {
    var p = PROJECTS[id]; if (!p) return;
    var lbl = STATUS_LABEL[p.status] || p.sl;
    if (lbl === 'Live') { live++; }
    else if (lbl === 'Concept') { cpt++; }
    else { dev++; }
  });
  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  set('pl-ct-total',      allIds.length);
  set('pl-ct-all',        allIds.length);
  set('pl-ct-live',       live);
  set('pl-ct-dev',        dev);
  set('pl-ct-cpt',        cpt);
  set('pl-ct-product',    ((CATEGORIES.product    || {}).ids || []).length);
  set('pl-ct-client',     ((CATEGORIES.client     || {}).ids || []).length);
  set('pl-ct-innovation', ((CATEGORIES.innovation || {}).ids || []).length);
}

/* ── Mobile Menu ───────────────────────────────────────────── */
function setupMobileMenu() {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Active Nav Link ───────────────────────────────────────── */
function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const isActive = (path === 'index.html' || path === '') ? href === 'index.html' || href === './' || href === '/'
      : href.includes(path);
    a.classList.toggle('active', isActive);
  });
}

/* ── Typewriter Effect ─────────────────────────────────────── */
function setupTypewriter(elId, words, speed = 100, pauseMs = 2200, deleteSpeed = 55) {
  const el = document.getElementById(elId);
  if (!el) return;
  let wi = 0, ci = 0, deleting = false;
  function type() {
    const word = words[wi];
    if (!deleting && ci <= word.length) {
      el.textContent = word.slice(0, ci++);
      setTimeout(type, speed);
    } else if (!deleting) {
      deleting = true;
      setTimeout(type, pauseMs);
    } else if (ci > 0) {
      el.textContent = word.slice(0, --ci);
      setTimeout(type, deleteSpeed);
    } else {
      deleting = false;
      wi = (wi + 1) % words.length;
      setTimeout(type, 280);
    }
  }
  type();
}

/* ── Smooth Scroll Buttons ─────────────────────────────────── */
function setupSmoothScroll() {
  document.querySelectorAll('[data-scroll]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ── FAQ Accordion ─────────────────────────────────────────── */
function setupFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const body = item.querySelector('.faq-body');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-body').style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* ── Stat Card SC Color Map ────────────────────────────────── */
const SC = {
  delivered: '#22d3a5', deployed: '#22d3a5', active: '#22d3a5',
  inprogress: '#3b82f6', demo: '#a78bfa',
  planning: '#fbbf24', concept: '#fb923c'
};
function sc(s) { return SC[s] || '#64789e'; }

/* ── Phase Dot Renderer ────────────────────────────────────── */
function phaseDots(phases) {
  return phases.map(ph => `<div class="pd pd-${ph.d ? 'd' : ph.a ? 'a' : 'p'}"></div>`).join('');
}
function phCls(ph) { return ph.d ? 'done' : ph.a ? 'active' : 'pend'; }

/* Resolve the maturity label (Live / In Development / Concept). Falls back
   to the project's own status label if STATUS_LABEL isn't loaded yet. */
function _matLabel(p) {
  return (typeof STATUS_LABEL !== 'undefined' && STATUS_LABEL[p.status]) || p.sl;
}

/* ── Project Banner ────────────────────────────────────────── */
function projBanner(id, p, h = 200) {
  const pillDark = ['delivered','deployed','active','demo'].includes(p.status);
  const matLabel = _matLabel(p);
  const screenshot = (typeof SCREENSHOTS !== 'undefined' && SCREENSHOTS[id]) || null;
  if (screenshot) return `
    <div class="cv" style="height:${h}px;background:linear-gradient(140deg,${p.g1},${p.g2});position:relative;overflow:hidden;">
      <img src="${screenshot}" alt="${p.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:14px;display:block;">
      <div class="status-pill" style="background:rgba(0,0,0,.38);backdrop-filter:blur(10px);border:1px solid rgba(var(--ov),.1);color:#fff;">${matLabel}</div>
    </div>`;
  if (p.logo) return `
    <div class="cv" style="height:${h}px;background:${p.logoBg};position:relative;">
      <img src="${p.logo}" alt="${p.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:20px;display:block;">
      <div class="status-pill" style="background:${sc(p.status)};color:${pillDark ? '#060d1f' : '#fff'};">${matLabel}</div>
    </div>`;
  return `
    <div class="cv" style="height:${h}px;background:linear-gradient(140deg,${p.g1},${p.g2});position:relative;">
      <div class="cv-noise"></div><div class="cv-circle"></div>
      <div class="cv-grad"><div class="cv-icon" style="font-size:${h > 260 ? 90 : 64}px;">${p.icon}</div></div>
      <div class="status-pill" style="background:rgba(0,0,0,.38);backdrop-filter:blur(10px);border:1px solid rgba(var(--ov),.1);color:#fff;">${matLabel}</div>
    </div>`;
}

/* ── Project Card (grid compact) ───────────────────────────── */
function gridCard(id, P) {
  const p = P[id];
  const desc = p.tag.length > 68 ? p.tag.slice(0, 65) + '…' : p.tag;
  const typePill = (typeof typePillHTML === 'function') ? typePillHTML(id) : '';
  return `
  <div class="pcard rev" data-cat="${p.cat}" style="--cglow:${p.glow};" onclick="openDetail('${id}')">
    ${projBanner(id, p, 170)}
    <div class="ci" style="padding:20px;">
      <div class="hier-row">${typePill}</div>
      <div class="ci-name" style="font-size:16px;margin-bottom:5px;">${p.name}</div>
      <div class="ci-desc" style="font-size:12px;margin-bottom:14px;">${desc}</div>
      <div class="phase-dots">${phaseDots(p.phases)}</div>
      <div class="ci-foot">
        <div class="ci-pct"><strong style="font-size:14px;">${p.pct}%</strong></div>
        <div class="ci-arrow" style="width:28px;height:28px;font-size:12px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      </div>
    </div>
  </div>`;
}

/* ── Project Detail Render ─────────────────────────────────── */
function renderDetail(id, P) {
  const p = P[id];
  const step = p.phases.map((ph, i) => {
    const c = phCls(ph), ic = ph.d ? '✓' : ph.a ? '●' : i + 1;
    return `<div class="pstep ${c}"><div class="pcirc">${ic}</div><div class="plbl">${ph.l}</div></div>`;
  }).join('');
  const tsks = (p.tasks || []).map(t => `
    <div class="trow ${t.d ? 'done' : ''}">
      <div class="tchk">${t.d ? '✓' : ''}</div>
      <span class="ttxt">${t.t}</span>
    </div>`).join('');
  const stgs = (p.stack || []).map(s => `<span class="stag">${s}</span>`).join('');
  const mets = (p.meta || []).map(m => `
    <div class="meta-i">
      <span class="m-icon">${m.i}</span>
      <div><div class="m-lbl">${m.l}</div><div class="m-val">${m.v}</div></div>
    </div>`).join('');
  const screenshot = (typeof SCREENSHOTS !== 'undefined' && SCREENSHOTS[id]) || null;
  const liveHref = p.liveUrl || p.link || '';
  const linkBtn = liveHref
    ? `<div style="margin:14px 0 4px;">
         <a href="${liveHref}" target="_blank" rel="noopener noreferrer"
            style="display:inline-flex;align-items:center;gap:8px;padding:11px 18px;background:linear-gradient(135deg,${p.accent},${p.accent}cc);color:#fff;text-decoration:none;font-weight:600;font-size:13.5px;letter-spacing:.02em;border-radius:8px;box-shadow:0 4px 16px ${p.glow};transition:transform .2s ease,box-shadow .2s ease;"
            onmouseover="this.style.transform='translateY(-1px)';"
            onmouseout="this.style.transform='';">
           Visit Live Platform
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>
       </div>`
    : '';
  const csBtn = p.caseStudy
    ? `<div style="margin:6px 0 4px;">
         <a href="${p.caseStudy}"
            style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:rgba(var(--ov),.05);color:var(--text);text-decoration:none;font-weight:600;font-size:13px;letter-spacing:.02em;border-radius:8px;border:1px solid rgba(var(--slt),.22);transition:background .2s ease;"
            onmouseover="this.style.background='rgba(var(--ov),.10)';"
            onmouseout="this.style.background='rgba(var(--ov),.05)';">
           View Case Study
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
         </a>
       </div>`
    : '';

  const mainContent = `
    <div class="det-eye">${p.client}</div>
    <div class="det-title">${p.name}</div>
    <div class="det-tag">${p.tag}</div>
    ${linkBtn}${csBtn}
    <div class="prog-wrap">
      <div class="prog-head"><span class="prog-lbl">Overall Progress</span><span class="prog-pct">${p.pct}%</span></div>
      <div class="prog-bg"><div class="prog-fill" id="dpFill" style="background:linear-gradient(90deg,${p.accent},${p.accent}99);"></div></div>
      <div class="prog-note ${p.dl.c}">${p.dl.t}</div>
    </div>
    <div class="det-div"><span>Project Timeline</span></div>
    <div class="stepper">${step}</div>
    ${tsks ? `<div class="det-div"><span>Tasks & Milestones</span></div><div class="tasks">${tsks}</div>` : ''}
    ${stgs ? `<div class="det-div"><span>Tech Stack</span></div><div class="stags">${stgs}</div>` : ''}
    ${mets ? `<div class="det-div"><span>Project Details</span></div><div class="meta-g">${mets}</div>` : ''}`;

  if (screenshot) {
    const sidebarLiveBtn = liveHref
      ? `<a href="${liveHref}" class="det-img-live-btn" target="_blank" rel="noopener noreferrer">
           Visit Live Platform
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>`
      : '';
    return `
      <div class="det-body">
        <div class="det-main">${mainContent}</div>
        <div class="det-sidebar">
          <div class="det-img-tile" style="background:linear-gradient(140deg,${p.g1},${p.g2});">
            <img src="${screenshot}" alt="${p.name} preview" loading="eager" decoding="async">
          </div>
          ${sidebarLiveBtn}
        </div>
      </div>`;
  }

  // Fallback: no screenshot — gradient/icon banner + single column
  const bannerHtml = p.logo
    ? `<div class="det-banner" style="background:${p.logoBg};">
         <img src="${p.logo}" alt="${p.name}">
         <div class="det-banner-grad"></div>
       </div>`
    : `<div class="det-banner" style="background:linear-gradient(140deg,${p.g1},${p.g2});display:flex;align-items:center;justify-content:center;">
         <div class="cv-noise"></div>
         <span style="font-size:96px;filter:drop-shadow(0 0 32px rgba(var(--ov),.22));position:relative;z-index:1;">${p.icon}</span>
         <div class="det-banner-grad"></div>
       </div>`;
  return `
    ${bannerHtml}
    <div class="det-content">${mainContent}</div>`;
}

/* ── Detail Overlay Controller ─────────────────────────────── */
function setupDetailOverlay(P) {
  window.openDetail = function(id) {
    const ov = document.getElementById('detOv');
    if (!ov || !P[id]) return;
    document.getElementById('detBody').innerHTML = renderDetail(id, P);
    document.getElementById('detNavTit').textContent = P[id].name;
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    ov.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => { const f = document.getElementById('dpFill'); if (f) f.style.width = P[id].pct + '%'; }, 250);
  };
  window.closeDetail = function() {
    const ov = document.getElementById('detOv');
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeDetail && closeDetail(); });
}

/* ── Contact Form ──────────────────────────────────────────── */
function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const original = btn.innerHTML;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Sent!`;
    btn.style.background = '#22d3a5';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; btn.disabled = false; form.reset(); }, 3000);
  });
}

/* ── Newsletter Form ───────────────────────────────────────── */
function setupNewsletter() {
  document.querySelectorAll('.nl-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.textContent = 'Subscribed!';
      btn.style.background = '#22d3a5';
      setTimeout(() => { btn.textContent = 'Subscribe'; btn.style.background = ''; form.reset(); }, 2500);
    });
  });
}

/* ── Theme Toggle (light / dark) ───────────────────────────── */
function setupThemeToggle() {
  const root = document.documentElement;
  const KEY = 'tas-theme';

  /* The inline <head> bootstrap already set data-theme before first paint,
     so here we only sync button state and wire up clicks. */
  function syncButtons(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function(b) {
      b.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    });
  }

  function setTheme(theme) {
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    syncButtons(theme);
  }

  syncButtons(root.getAttribute('data-theme') || 'dark');

  document.querySelectorAll('.theme-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      setTheme(next);
    });
  });

  /* Follow the OS preference only while the visitor hasn't chosen a theme. */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onChange = function(e) {
      var stored;
      try { stored = localStorage.getItem(KEY); } catch (err) {}
      if (stored !== 'light' && stored !== 'dark') {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    if (mq.addEventListener) { mq.addEventListener('change', onChange); }
    else if (mq.addListener) { mq.addListener(onChange); }
  }
}

/* ── Floating page controls: back + scroll-to-top ─────────────
   Injected on every page (each page loads main.js) so the markup
   lives in one place. Back uses real browser history; scroll-to-top
   fades in once the user has scrolled down. */
function setupFloatingNav() {
  if (document.querySelector('.fab-top')) return; // already injected
  var inSub = /\/case-studies\//.test(location.pathname);
  var home  = (inSub ? '../' : '') + 'index.html';
  var file   = location.pathname.slice(location.pathname.lastIndexOf('/') + 1);
  var isHome = !inSub && (file === '' || file === 'index.html'); // no "previous page" on home

  var back = document.createElement('button');
  back.type = 'button';
  back.className = 'fab fab-back';
  back.title = 'Back';
  back.setAttribute('aria-label', 'Go back to the previous page');
  back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
  back.addEventListener('click', function() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = home;
  });

  var toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'fab fab-top';
  toTop.title = 'Back to top';
  toTop.setAttribute('aria-label', 'Scroll back to top');
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
  toTop.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (!isHome) document.body.appendChild(back); // hidden on the home page
  document.body.appendChild(toTop);

  var onScroll = function() {
    if (window.scrollY > 400) toTop.classList.add('show');
    else toTop.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Click-to-expand disclosures (.mx-disc) ───────────────────
   A collapsed section (grid 0fr→1fr) whose .mx-head toggles it open.
   Idempotent + accepts a root so it can re-bind after dynamic renders. */
function setupDisclosures(root) {
  (root || document).querySelectorAll('.mx-disc').forEach(function(disc) {
    if (disc.dataset.mxInit) return;
    var head  = disc.querySelector('.mx-head');
    var body  = disc.querySelector('.mx-body');
    var inner = disc.querySelector('.mx-inner');
    if (!head || !body) return;
    disc.dataset.mxInit = '1';
    // Once fully open, let overflow show so hover shadows/glows aren't clipped.
    body.addEventListener('transitionend', function(e) {
      if (e.propertyName === 'grid-template-rows' && disc.classList.contains('open') && inner) {
        inner.style.overflow = 'visible';
      }
    });
    var toggle = function() {
      var willOpen = !disc.classList.contains('open');
      if (!willOpen && inner) inner.style.overflow = 'hidden'; // re-clip before collapsing
      var open = disc.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}

/* ── Init All ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  setupFloatingNav();
  setupDisclosures();
  setupThemeToggle();
  setupReveal();
  setupStats();
  updateEcosystemCounts();
  setupMobileMenu();
  setActiveNav();
  setupSmoothScroll();
  setupFAQ();
  setupContactForm();
  setupNewsletter();
});
