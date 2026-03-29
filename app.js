'use strict';

// =====================================================
// CONSTANTS & localStorage KEYS
// =====================================================
const DAYS        = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DAYS_SHORT  = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const LS_SEASON       = 'tg_season';
const LS_SEASON_M     = 'tg_season_manana';
const LS_THEME_MANUAL = 'tg_theme_manual';
const LS_CHECKLIST    = 'tg_checklist';

// =====================================================
// CIRCADIAN COLOR ENGINE
// =====================================================
function minuteOfDay() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

const PHASES = [
  {
    id: 'dawn', label: 'Amanecer — Activación', icon: '🌅',
    start: 360, end: 600,
    bg:   'hsl(340, 60%, 97%)',
    orb1: 'radial-gradient(circle, hsla(340,70%,82%,0.65), transparent 70%)',
    orb2: 'radial-gradient(circle, hsla(210,70%,88%,0.55), transparent 70%)',
    orb3: 'radial-gradient(circle, hsla(270,50%,90%,0.45), transparent 70%)',
    pos1: { top:'60%',  left:'-80px'  },
    pos2: { top:'70%',  right:'-60px' },
    pos3: { top:'80%',  left:'30%'    },
    metaColor: '#FFF0F5',
    isNight: false,
  },
  {
    id: 'day', label: 'Día Pleno — Protección', icon: '☀️',
    start: 600, end: 1020,
    bg:   'hsl(205, 80%, 97%)',
    orb1: 'radial-gradient(circle, hsla(205,75%,80%,0.60), transparent 70%)',
    orb2: 'radial-gradient(circle, hsla(45,80%,88%,0.55),  transparent 70%)',
    orb3: 'radial-gradient(circle, hsla(185,60%,88%,0.45), transparent 70%)',
    pos1: { top:'-60px', left:'20%'    },
    pos2: { top:'20%',   right:'-80px' },
    pos3: { top:'40%',   left:'-60px'  },
    metaColor: '#F0F8FF',
    isNight: false,
  },
  {
    id: 'dusk', label: 'Hora Dorada — Transición', icon: '🌇',
    start: 1020, end: 1260,
    bg:   'hsl(25, 70%, 95%)',
    orb1: 'radial-gradient(circle, hsla(25,85%,70%,0.65),  transparent 70%)',
    orb2: 'radial-gradient(circle, hsla(300,50%,75%,0.55), transparent 70%)',
    orb3: 'radial-gradient(circle, hsla(0,70%,75%,0.45),   transparent 70%)',
    pos1: { top:'40%', left:'-80px'  },
    pos2: { top:'35%', right:'-60px' },
    pos3: { top:'55%', left:'25%'    },
    metaColor: '#FFF0E5',
    isNight: false,
  },
  {
    id: 'night', label: 'Noche — Reparación', icon: '🌙',
    start: 1260, end: 360,
    bg:   'hsl(240, 30%, 8%)',
    orb1: 'radial-gradient(circle, hsla(260,60%,35%,0.75), transparent 70%)',
    orb2: 'radial-gradient(circle, hsla(240,50%,25%,0.65), transparent 70%)',
    orb3: 'radial-gradient(circle, hsla(280,45%,30%,0.55), transparent 70%)',
    pos1: { top:'-80px', left:'10%'    },
    pos2: { top:'-60px', right:'10%'   },
    pos3: { top:'15%',   left:'35%'    },
    metaColor: '#0F0E1A',
    isNight: true,
  },
];

function getPhase(min) {
  if (min >= 360  && min < 600)  return PHASES[0]; // dawn
  if (min >= 600  && min < 1020) return PHASES[1]; // day
  if (min >= 1020 && min < 1260) return PHASES[2]; // dusk
  return PHASES[3];                                 // night
}

// =====================================================
// CIRCADIAN ENGINE — aplica tema + colores al DOM
// =====================================================
let circadianTimer = null;

function applyCircadianCycle() {
  const min   = minuteOfDay();
  const phase = getPhase(min);
  const html  = document.documentElement;

  const manualThemeLS = localStorage.getItem(LS_THEME_MANUAL);
  const systemDark    = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Noche automática: phase.isNight OR preferencia del sistema OR override manual
  const isNightMode   = phase.isNight || manualThemeLS === 'night' || (!manualThemeLS && systemDark);

  html.setAttribute('data-phase', phase.id);
  html.setAttribute('data-theme', isNightMode ? 'night' : 'day');

  // Fondo y orbes
  const auraBg = document.getElementById('auraBg');
  if (auraBg) auraBg.style.background = phase.bg;

  ['orb1','orb2','orb3'].forEach((id, idx) => {
    const orb = document.getElementById(id);
    if (!orb || orb.classList.contains('halo-touch')) return;
    const bgKey  = `orb${idx+1}`;
    const posKey = `pos${idx+1}`;
    orb.style.background = phase[bgKey];
    orb.style.top = phase[posKey].top;
    if (phase[posKey].left)  { orb.style.left  = phase[posKey].left;  orb.style.right = ''; }
    if (phase[posKey].right) { orb.style.right = phase[posKey].right; orb.style.left  = ''; }
  });

  // Labels
  const label = document.getElementById('circadianLabel');
  if (label) label.textContent = `${phase.icon} ${phase.label}`;

  const metaColor = document.getElementById('metaThemeColor');
  if (metaColor) metaColor.setAttribute('content', isNightMode ? '#0F0E1A' : phase.metaColor);

  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = isNightMode ? '☀️' : '🌙';

  // Actualizar visibilidad de secciones en pestaña Hoy
  updateRoutineVisibility(phase.isNight);
}

function startCircadianCycle() {
  applyCircadianCycle();
  const now = new Date();
  const msToNextMin = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(() => {
    applyCircadianCycle();
    circadianTimer = setInterval(applyCircadianCycle, 60_000);
  }, msToNextMin);
}

// =====================================================
// RUTINA CONTEXTUAL — muestra solo lo que toca ahora
// =====================================================
function updateRoutineVisibility(isNightPhase) {
  const morningBlock = document.getElementById('morning-block');
  const nightBlock   = document.getElementById('night-block');
  const morningHint  = document.getElementById('morning-hint');
  const nightHint    = document.getElementById('night-hint');
  if (!morningBlock || !nightBlock) return;

  if (isNightPhase) {
    // Fase noche: mostrar noche, ocultar mañana
    morningBlock.style.display = 'none';
    nightBlock.style.display   = 'block';
    if (morningHint) morningHint.style.display = 'none';
    if (nightHint)   nightHint.style.display   = 'none';
  } else {
    // Fase día: mostrar mañana, ocultar noche
    morningBlock.style.display = 'block';
    nightBlock.style.display   = 'none';
    if (morningHint) morningHint.style.display = 'none';
    if (nightHint)   nightHint.style.display   = 'block';
  }
}

// =====================================================
// GRAIN CANVAS
// =====================================================
function initGrain() {
  const canvas = document.getElementById('grainCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGrain();
  }
  function drawGrain() {
    const w = canvas.width, h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      data[i] = data[i+1] = data[i+2] = v;
      data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
}

// =====================================================
// HALO TOUCH
// =====================================================
function initHaloTouch() {
  const orb1 = document.getElementById('orb1');
  if (!orb1) return;
  let haloTimer;
  function onTouch(cx, cy) {
    const orbW = orb1.offsetWidth  || 360;
    const orbH = orb1.offsetHeight || 360;
    orb1.classList.add('halo-touch');
    orb1.style.top   = `${cy - orbH / 2}px`;
    orb1.style.left  = `${cx - orbW / 2}px`;
    orb1.style.right = '';
    clearTimeout(haloTimer);
    haloTimer = setTimeout(() => {
      orb1.classList.remove('halo-touch');
      applyCircadianCycle();
    }, 3000);
  }
  document.addEventListener('touchmove', e => onTouch(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  document.addEventListener('mousemove',  e => {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    onTouch(e.clientX, e.clientY);
  });
}

// =====================================================
// DATA
// =====================================================
const MORNING_STEPS = {
  invierno: [
    { label:'Limpieza',         product:'CeraVe Hydrating',               note:'Solo para quitar el sudor de la noche. Agua fresca también vale.',                  icon:'🧇', color:'step-blue'   },
    { label:'Contorno Ojos',    product:'L\'Oréal Roll-on',                note:'💡 Truco: Guárdalo en la nevera para deshinchar.',                                  icon:'👁',  color:'step-purple' },
    { label:'Hidratación',       product:'Crema Akytania',                 note:'En invierno la piel necesita más barrera protectora.',                           icon:'💧', color:'step-pink'   },
    { label:'Protección Solar',  product:'Garnier Super UV Fluido SPF 50', note:'⚠️ Obligatorio siempre. Agita el bote antes de usar. ¡Cuello y orejas también!',  icon:'🛡', color:'step-gold'   },
  ],
  verano: [
    { label:'Limpieza',         product:'CeraVe Hydrating o agua fresca', note:'Solo para quitar el sudor de la noche.',                                          icon:'🧇', color:'step-blue'   },
    { label:'Contorno Ojos',    product:'L\'Oréal Roll-on',                note:'💡 Truco: Guárdalo en la nevera para deshinchar.',                                  icon:'👁',  color:'step-purple' },
    { label:'Hidratación',       product:'Gel L\'Oréal o NADA',            note:'En verano el protector solar ya hidrata bastante.',                            icon:'💧', color:'step-pink'   },
    { label:'Protección Solar',  product:'Garnier Super UV Fluido SPF 50', note:'⚠️ Obligatorio siempre. Agita el bote antes de usar. ¡Cuello y orejas también!',  icon:'🛡', color:'step-gold'   },
  ],
};

const NIGHT_SCHEDULE = [
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' }, // Dom
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' }, // Lun
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' }, // Mar
  { type:'olay', cleanser:'CeraVe (Suave)', serum:'❌ NADA',                    eyes:'Beauty of Joseon', cream:'Olay Vit C + AHA'    }, // Mié
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' }, // Jue
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' }, // Vie
  { type:'olay', cleanser:'CeraVe (Suave)', serum:'❌ NADA',                    eyes:'Beauty of Joseon', cream:'Olay Vit C + AHA'    }, // Sáb
];

const TIPS = [
  { icon:'⚠️', title:'Regla Olay (Mié y Sáb)',    text:'Esas noches NUNCA uses la Niacinamida de The Ordinary. La crema Olay ya es el tratamiento completo por sí sola.' },
  { icon:'👆', title:'Margen de Seguridad Olay',  text:'Cuando te pongas la crema Olay, no la acerques demasiado a los ojos. Deja un dedo de distancia.' },
  { icon:'💧', title:'Cantidad de Niacinamida',   text:'Con 3 gotas para toda la cara es suficiente. Si usas más, te saldrán "pelotillas" blancas al poner la crema después.' },
  { icon:'🦢', title:'Cuello y Orejas',           text:'¡No los olvides! Especialmente con el protector solar por la mañana. Son las zonas más olvidadas y las que más envejecen.' },
  { icon:'🔢', title:'Orden Contorno BoJ',        text:'Siempre pon el Beauty of Joseon antes de tu crema de noche (Cien, Akytania u Olay). Sérum → Contorno → Crema.' },
  { icon:'🧈', title:'Truco del Roll-on',         text:'Guarda el L\'Oréal Roll-on en la nevera. El frío ayuda a deshinchar las ojeras muchísimo más.' },
  { icon:'🌅', title:'SPF, siempre',              text:'El Garnier Super UV SPF 50 es obligatorio todos los días, aunque esté nublado. La radiación UV atraviesa las nubes.' },
];

// =====================================================
// STATE
// =====================================================
let season       = localStorage.getItem(LS_SEASON)   || 'invierno';
let seasonManana = localStorage.getItem(LS_SEASON_M) || 'invierno';
let manualTheme  = localStorage.getItem(LS_THEME_MANUAL);

function todayStr() { return new Date().toISOString().slice(0, 10); }
function loadChecklist() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_CHECKLIST) || 'null');
    if (raw && raw.date === todayStr()) return raw.done || {};
  } catch (_) {}
  return {};
}
function saveChecklist(done) {
  localStorage.setItem(LS_CHECKLIST, JSON.stringify({ date: todayStr(), done }));
}
let checklist = loadChecklist();

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initTabs();
  renderHoy();
  renderManana();
  renderNightCalendar();
  renderTips();
  initServiceWorker();
  startCircadianCycle(); // aplica tema + visibilidad
  initGrain();
  initHaloTouch();
  initThemeSystem();
  initGlowTracking();
  initScrollSpring();
});

// =====================================================
// DATE
// =====================================================
function initDate() {
  const now  = new Date();
  const opts = { weekday:'long', day:'numeric', month:'long' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('es-ES', opts);
}

// =====================================================
// TABS
// =====================================================
function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  let animating = false;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (animating) return;
      const targetId = 'tab-' + btn.dataset.tab;
      const current  = document.querySelector('.tab-content.active');
      const target   = document.getElementById(targetId);
      if (current === target) return;

      animating = true;
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (current) {
        current.classList.add('tab-leaving');
        current.classList.remove('active');
        setTimeout(() => {
          current.classList.remove('tab-leaving');
          current.style.display = 'none';
          target.style.display = 'block';
          void target.offsetHeight;
          target.classList.add('active');
          animating = false;
        }, 280);
      } else {
        target.style.display = 'block';
        void target.offsetHeight;
        target.classList.add('active');
        animating = false;
      }
    });
  });
}

// =====================================================
// SCROLL SPRING RESISTANCE
// =====================================================
function initScrollSpring() {
  const app = document.getElementById('app');
  if (!app) return;
  const MAX_STRETCH = 28, RESISTANCE = 0.38;
  let touchStartY = 0, isTouching = false, currentStretch = 0, releaseTimer = null;

  function getScrollInfo() {
    const el = document.scrollingElement || document.documentElement;
    return { top: el.scrollTop, max: el.scrollHeight - el.clientHeight };
  }
  function applyStretch(px) {
    currentStretch = Math.max(-MAX_STRETCH, Math.min(MAX_STRETCH, px));
    app.style.setProperty('--scroll-stretch', currentStretch.toFixed(2));
    app.classList.add('spring-active');
    app.classList.remove('spring-release');
  }
  function releaseSpring() {
    currentStretch = 0;
    app.style.setProperty('--scroll-stretch', '0');
    app.classList.remove('spring-active');
    app.classList.add('spring-release');
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => app.classList.remove('spring-release'), 600);
  }

  app.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; isTouching = true; }, { passive: true });
  app.addEventListener('touchmove', e => {
    if (!isTouching) return;
    const info = getScrollInfo();
    const deltaY = e.touches[0].clientY - touchStartY;
    if (info.top <= 0 && deltaY > 0) { applyStretch(deltaY * RESISTANCE); return; }
    if (info.top >= info.max - 60 && deltaY < 0) { applyStretch(deltaY * RESISTANCE); return; }
    if (currentStretch !== 0) releaseSpring();
  }, { passive: true });
  app.addEventListener('touchend',   () => { isTouching = false; if (currentStretch !== 0) releaseSpring(); }, { passive: true });
  app.addEventListener('touchcancel',() => { isTouching = false; releaseSpring(); }, { passive: true });

  let wheelDebounce = null;
  window.addEventListener('wheel', e => {
    const info = getScrollInfo();
    if (info.top <= 0 && e.deltaY < 0)           applyStretch( Math.abs(e.deltaY) * RESISTANCE * 0.6);
    else if (info.top >= info.max - 2 && e.deltaY > 0) applyStretch(-Math.abs(e.deltaY) * RESISTANCE * 0.6);
    clearTimeout(wheelDebounce);
    wheelDebounce = setTimeout(releaseSpring, 120);
  }, { passive: true });
}

// =====================================================
// RENDER HOY
// =====================================================
function renderHoy() {
  const dow = new Date().getDay();
  document.getElementById('dayBadge').textContent = DAYS_SHORT[dow];
  document.getElementById('dayTitle').textContent  = DAYS[dow];
  renderMorningSteps('morningRoutine', season);
  renderNightToday(dow);
  // La visibilidad se aplica después en applyCircadianCycle()
}

function renderMorningSteps(containerId, s) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = MORNING_STEPS[s].map((step, i) =>
    stepCardHTML(step, i, `morning-${i}`, !!checklist[`morning-${i}`])
  ).join('');
  attachStepInteractions(container);
}

function renderNightToday(dow) {
  const schedule  = NIGHT_SCHEDULE[dow];
  const container = document.getElementById('nightRoutine');
  const alertBox  = document.getElementById('nightAlert');
  if (!container) return;
  const isOlay = schedule.type === 'olay';
  const steps = [
    { label:'Limpieza',                                product: schedule.cleanser, icon:'🧇', color:'step-blue'                          },
    { label: isOlay ? 'Sérum — DESCANSO' : 'Sérum Cara', product: schedule.serum,    icon: isOlay ? '🚫' : '💪', color: isOlay ? 'step-purple' : 'step-green' },
    { label:'Contorno Ojos',                           product: schedule.eyes,     icon:'👁',  color:'step-purple'                         },
    { label:'Crema Final',                             product: schedule.cream,    icon:'🌙', color:'step-pink'                           },
  ];
  container.innerHTML = steps.map((step, i) =>
    stepCardHTML(step, i, `night-${i}`, !!checklist[`night-${i}`])
  ).join('');
  attachStepInteractions(container);

  if (isOlay) {
    alertBox.innerHTML = '<strong>⚠️ Noche Olay</strong> Recuerda: NO uses Niacinamida esta noche. La Olay ya es el tratamiento completo. Deja 1 dedo de distancia de la zona de ojos.';
    alertBox.classList.add('show');
  } else {
    alertBox.classList.remove('show');
  }
}

function stepCardHTML(step, i, id, isDone) {
  const doneClass = isDone ? ' completed' : '';
  const checkMark = isDone ? '<div class="step-check">✓</div>' : '';
  return `
    <div class="step-card ${step.color}${doneClass}" data-step-id="${id}">
      ${checkMark}
      <div class="step-number">${step.icon}</div>
      <div class="step-info">
        <div class="step-label">Paso ${i + 1} — ${step.label}</div>
        <div class="step-product">${step.product}</div>
        ${step.note ? `<div class="step-note">${step.note}</div>` : ''}
      </div>
    </div>`;
}

// =====================================================
// STEP INTERACTIONS
// =====================================================
function attachStepInteractions(container) {
  container.querySelectorAll('.step-card').forEach(card => {
    card.addEventListener('click', () => {
      const id     = card.dataset.stepId;
      const isDone = !!checklist[id];
      if (!isDone) {
        checklist[id] = true;
        saveChecklist(checklist);
        card.classList.add('completing');
        setTimeout(() => {
          card.classList.remove('completing');
          card.classList.add('completed');
          if (!card.querySelector('.step-check')) {
            const check = document.createElement('div');
            check.className = 'step-check';
            check.textContent = '✓';
            card.prepend(check);
          }
        }, 180);
      } else {
        delete checklist[id];
        saveChecklist(checklist);
        card.classList.remove('completed');
        card.classList.add('completing');
        const check = card.querySelector('.step-check');
        if (check) check.remove();
        setTimeout(() => card.classList.remove('completing'), 180);
      }
      hapticVisual(card);
    });
  });
}

function hapticVisual(card) {
  if (navigator.vibrate) navigator.vibrate([10, 6, 4]);
  card.classList.remove('haptic-pop');
  void card.offsetWidth;
  card.classList.add('haptic-pop');
  card.addEventListener('animationend', () => card.classList.remove('haptic-pop'), { once: true });
}

// =====================================================
// SEASON TOGGLE
// =====================================================
window.setSeason = function(s) {
  season = s;
  localStorage.setItem(LS_SEASON, s);
  document.getElementById('btnInvierno').classList.toggle('active', s === 'invierno');
  document.getElementById('btnVerano').classList.toggle('active',   s === 'verano');
  renderMorningSteps('morningRoutine', s);
};
window.setSeasonManana = function(s) {
  seasonManana = s;
  localStorage.setItem(LS_SEASON_M, s);
  document.getElementById('btnInviernoM').classList.toggle('active', s === 'invierno');
  document.getElementById('btnVeranoM').classList.toggle('active',   s === 'verano');
  renderManana();
};

// =====================================================
// RENDER MAÑANA
// =====================================================
function renderManana() {
  const container = document.getElementById('morningFullList');
  if (!container) return;
  container.innerHTML = `<div class="routine-list">${MORNING_STEPS[seasonManana].map((step, i) =>
    stepCardHTML(step, i, `mfull-${i}`, !!checklist[`mfull-${i}`])
  ).join('')}</div>`;
  attachStepInteractions(container);
}

// =====================================================
// RENDER NIGHT CALENDAR
// =====================================================
function renderNightCalendar() {
  const el = document.getElementById('nightCalendar');
  if (!el) return;
  const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const order    = [1,2,3,4,5,6,0];
  el.innerHTML = `<div class="night-calendar">${order.map(i => {
    const s = NIGHT_SCHEDULE[i], isOlay = s.type === 'olay';
    return `<div class="night-row ${isOlay ? 'olay-night' : 'nia-night'}">
      <div class="night-day">${dayNames[i]}<span>${isOlay ? '✨ Noche Olay' : '💪 Niacinamida'}</span></div>
      <div class="night-steps">
        <div class="night-step"><span class="night-step-label">🧇 Limpieza</span><span class="night-step-product">${s.cleanser}</span></div>
        <div class="night-step"><span class="night-step-label">💊 Sérum</span><span class="night-step-product">${s.serum}</span></div>
        <div class="night-step"><span class="night-step-label">👁 Contorno</span><span class="night-step-product">${s.eyes}</span></div>
        <div class="night-step"><span class="night-step-label">🌙 Crema</span><span class="night-step-product">${s.cream}</span></div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// =====================================================
// RENDER TIPS
// =====================================================
function renderTips() {
  const el = document.getElementById('tipsList');
  if (!el) return;
  el.innerHTML = `<div class="tips-list">${TIPS.map(tip =>
    `<div class="tip-card"><div class="tip-icon">${tip.icon}</div><div class="tip-content"><h3>${tip.title}</h3><p>${tip.text}</p></div></div>`
  ).join('')}</div>`;
}

// =====================================================
// THEME SYSTEM
// =====================================================
function initThemeSystem() {
  const mq  = window.matchMedia('(prefers-color-scheme: dark)');
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    manualTheme = current === 'night' ? 'day' : 'night';
    localStorage.setItem(LS_THEME_MANUAL, manualTheme);
    applyCircadianCycle();
  });

  // Long press = resetear a automático
  let pressTimer;
  btn.addEventListener('pointerdown', () => {
    pressTimer = setTimeout(() => {
      manualTheme = null;
      localStorage.removeItem(LS_THEME_MANUAL);
      applyCircadianCycle();
      btn.classList.add('haptic-pop');
      btn.addEventListener('animationend', () => btn.classList.remove('haptic-pop'), { once: true });
    }, 700);
  });
  btn.addEventListener('pointerup',    () => clearTimeout(pressTimer));
  btn.addEventListener('pointerleave', () => clearTimeout(pressTimer));
  mq.addEventListener('change', () => { if (!manualTheme) applyCircadianCycle(); });
}

// =====================================================
// GLOW TRACKING
// =====================================================
function initGlowTracking() {
  document.addEventListener('mousemove', e => handleGlowAt(e.clientX, e.clientY));
  document.addEventListener('touchmove', e => handleGlowAt(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', e => {
      const xPct = Math.min(Math.max(((e.gamma||0) + 45) / 90, 0), 1) * 100;
      const yPct = Math.min(Math.max(((e.beta||0)  - 10) / 80, 0), 1) * 100;
      document.querySelectorAll('.step-card:not(.completed)').forEach(card => {
        card.style.setProperty('--glow-pos',
          `radial-gradient(circle 90px at ${xPct}% ${yPct}%, rgba(255,255,255,0.14), transparent 70%)`);
      });
    }, { passive: true });
  }
}

function handleGlowAt(cx, cy) {
  const dayCard = document.querySelector('.day-card');
  if (dayCard) {
    const r = dayCard.getBoundingClientRect();
    const overlay = dayCard.querySelector('.card-glow-overlay');
    if (overlay) overlay.style.background =
      `radial-gradient(circle 130px at ${((cx-r.left)/r.width*100).toFixed(1)}% ${((cy-r.top)/r.height*100).toFixed(1)}%, rgba(255,255,255,0.22), transparent 70%)`;
  }
  document.querySelectorAll('.step-card:not(.completed)').forEach(card => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--glow-pos',
      `radial-gradient(circle 80px at ${((cx-r.left)/r.width*100).toFixed(1)}% ${((cy-r.top)/r.height*100).toFixed(1)}%, rgba(255,255,255,0.12), transparent 70%)`);
  });
}

// =====================================================
// SERVICE WORKER
// =====================================================
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}
