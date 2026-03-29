'use strict';

// === CONSTANTS ===
const DAYS        = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DAYS_SHORT  = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const LS_SEASON        = 'tg_season';
const LS_SEASON_M      = 'tg_season_manana';
const LS_THEME_MANUAL  = 'tg_theme_manual';   // 'day' | 'night' | null
const LS_CHECKLIST     = 'tg_checklist';       // { date: 'YYYY-MM-DD', done: {id:true} }

// === DATA ===
const MORNING_STEPS = {
  invierno: [
    { label:'Limpieza',          product:'CeraVe Hydrating',             note:'Solo para quitar el sudor de la noche. Agua fresca también vale.',                               icon:'🫧', color:'step-blue'   },
    { label:'Contorno de Ojos',  product:'L\'Oréal Roll-on',              note:'💡 Truco: Guárdalo en la nevera para deshinchar.',                                              icon:'👁',  color:'step-purple' },
    { label:'Hidratación',        product:'Crema Akytania',               note:'En invierno la piel necesita más barrera protectora.',                                         icon:'💧', color:'step-pink'   },
    { label:'Protección Solar',   product:'Garnier Super UV Fluido SPF 50',note:'⚠️ Obligatorio siempre. Agita el bote antes de usar. ¡Cuello y orejas también!',              icon:'🛡', color:'step-gold'   },
  ],
  verano: [
    { label:'Limpieza',          product:'CeraVe Hydrating o agua fresca',note:'Solo para quitar el sudor de la noche.',                                                     icon:'🫧', color:'step-blue'   },
    { label:'Contorno de Ojos',  product:'L\'Oréal Roll-on',              note:'💡 Truco: Guárdalo en la nevera para deshinchar.',                                              icon:'👁',  color:'step-purple' },
    { label:'Hidratación',        product:'Gel L\'Oréal o NADA',          note:'En verano el protector solar ya hidrata bastante.',                                          icon:'💧', color:'step-pink'   },
    { label:'Protección Solar',   product:'Garnier Super UV Fluido SPF 50',note:'⚠️ Obligatorio siempre. Agita el bote antes de usar. ¡Cuello y orejas también!',              icon:'🛡', color:'step-gold'   },
  ],
};

const NIGHT_SCHEDULE = [
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' },
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' },
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' },
  { type:'olay', cleanser:'CeraVe (Suave)', serum:'❌ NADA',                    eyes:'Beauty of Joseon', cream:'Olay Vit C + AHA'    },
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' },
  { type:'nia',  cleanser:'Solimo Carbón',  serum:'Niacinamida T.O. (3 gotas)', eyes:'Beauty of Joseon', cream:'Akytania o Cien Q10' },
  { type:'olay', cleanser:'CeraVe (Suave)', serum:'❌ NADA',                    eyes:'Beauty of Joseon', cream:'Olay Vit C + AHA'    },
];

const TIPS = [
  { icon:'⚠️', title:'Regla Olay (Mié y Sáb)',      text:'Esas noches NUNCA uses la Niacinamida de The Ordinary. La crema Olay ya es el tratamiento completo por sí sola.' },
  { icon:'👆', title:'Margen de Seguridad Olay',    text:'Cuando te pongas la crema Olay, no la acerques demasiado a los ojos (donde ya tienes el Beauty of Joseon). Deja un dedo de distancia.' },
  { icon:'💧', title:'Cantidad de Niacinamida',     text:'Con 3 gotas para toda la cara es suficiente. Si usas más, te saldrán "pelotillas" blancas al poner la crema después.' },
  { icon:'🦒', title:'Cuello y Orejas',             text:'¡No los olvides! Especialmente con el protector solar por la mañana. Son las zonas más olvidadas y las que más envejecen.' },
  { icon:'🔢', title:'Orden Contorno BoJ',          text:'Siempre pon el Beauty of Joseon antes de tu crema de noche (Cien, Akytania u Olay). Sérum → Contorno → Crema.' },
  { icon:'🧊', title:'Truco del Roll-on',           text:'Guarda el L\'Oréal Roll-on en la nevera. El frío ayuda a deshinchar las ojeras muchísimo más. ¡Marca la diferencia!' },
  { icon:'🌅', title:'SPF, siempre',                text:'El Garnier Super UV SPF 50 es obligatorio todos los días, aunque esté nublado. La radiación UV atraviesa las nubes.' },
];

// === STATE ===
let season        = localStorage.getItem(LS_SEASON)   || 'invierno';
let seasonManana  = localStorage.getItem(LS_SEASON_M) || 'invierno';
let currentTheme  = 'day';
let manualTheme   = localStorage.getItem(LS_THEME_MANUAL); // null = follow system

// --- Checklist helpers ---
function todayStr() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function loadChecklist() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_CHECKLIST) || 'null');
    if (raw && raw.date === todayStr()) return raw.done || {};
  } catch (_) {}
  return {}; // new day or first run
}

function saveChecklist(done) {
  localStorage.setItem(LS_CHECKLIST, JSON.stringify({ date: todayStr(), done }));
}

let checklist = loadChecklist();

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initTabs();
  renderHoy();
  renderManana();
  renderNightCalendar();
  renderTips();
  initServiceWorker();
  initThemeSystem();
  initGlowTracking();
});

// === DATE ===
function initDate() {
  const now  = new Date();
  const opts = { weekday:'long', day:'numeric', month:'long' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('es-ES', opts);
}

// === TABS ===
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// =====================
// === RENDER HOY ===
// =====================
function renderHoy() {
  const now = new Date();
  const dow = now.getDay();
  document.getElementById('dayBadge').textContent = DAYS_SHORT[dow];
  document.getElementById('dayTitle').textContent  = DAYS[dow];
  renderMorningSteps('morningRoutine', season);
  renderNightToday(dow);
}

function renderMorningSteps(containerId, s) {
  const container = document.getElementById(containerId);
  const steps     = MORNING_STEPS[s];
  container.innerHTML = steps.map((step, i) => {
    const id        = `morning-${i}`;
    const isDone    = !!checklist[id];
    return stepCardHTML(step, i, id, isDone);
  }).join('');
  attachStepInteractions(container);
}

function renderNightToday(dow) {
  const schedule  = NIGHT_SCHEDULE[dow];
  const container = document.getElementById('nightRoutine');
  const alertBox  = document.getElementById('nightAlert');
  const isOlay    = schedule.type === 'olay';
  const steps = [
    { label:'Limpieza',                          product:schedule.cleanser, icon:'🫧', color:'step-blue'   },
    { label:isOlay ? 'Sérum — DESCANSO':'Sérum Cara', product:schedule.serum,    icon:isOlay ? '🚫':'💚', color:isOlay ? 'step-purple':'step-green' },
    { label:'Contorno Ojos',                     product:schedule.eyes,     icon:'👁',  color:'step-purple' },
    { label:'Crema Final',                       product:schedule.cream,    icon:'🌙', color:'step-pink'   },
  ];
  container.innerHTML = steps.map((step, i) => {
    const id     = `night-${i}`;
    const isDone = !!checklist[id];
    return stepCardHTML(step, i, id, isDone);
  }).join('');
  attachStepInteractions(container);
  if (isOlay) {
    alertBox.innerHTML = '<strong>⚠️ Noche Olay</strong>Recuerda: NO uses Niacinamida esta noche. La Olay ya es el tratamiento completo. Deja 1 dedo de distancia de la zona de ojos.';
    alertBox.classList.add('show');
  } else {
    alertBox.classList.remove('show');
  }
}

// === STEP CARD HTML ===
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

// === STEP INTERACTIONS (Checklist + Haptic visual) ===
function attachStepInteractions(container) {
  container.querySelectorAll('.step-card').forEach(card => {
    card.addEventListener('click', () => {
      const id      = card.dataset.stepId;
      const isDone  = !!checklist[id];

      if (!isDone) {
        checklist[id] = true;
        saveChecklist(checklist);
        // Add completed state
        card.classList.add('completing'); // spring-press animation first
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
        // Toggle off
        delete checklist[id];
        saveChecklist(checklist);
        card.classList.remove('completed');
        const check = card.querySelector('.step-check');
        if (check) check.remove();
        card.classList.add('completing');
        setTimeout(() => card.classList.remove('completing'), 180);
      }

      hapticVisual(card);
    });
  });
}

// === HAPTIC VISUAL (iOS-safe: pure CSS spring) ===
function hapticVisual(card) {
  // navigator.vibrate is a no-op on iOS — rely on visual spring only
  if (navigator.vibrate) navigator.vibrate([10, 6, 4]);
  card.classList.remove('haptic-pop');
  void card.offsetWidth; // force reflow to restart animation
  card.classList.add('haptic-pop');
  card.addEventListener('animationend', () => card.classList.remove('haptic-pop'), { once: true });
}

// ======================
// === SEASON TOGGLE ===
// ======================
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

// === RENDER MAÑANA ===
function renderManana() {
  const container = document.getElementById('morningFullList');
  const steps     = MORNING_STEPS[seasonManana];
  container.innerHTML = `<div class="routine-list">${steps.map((step, i) => {
    const id     = `mfull-${i}`;
    const isDone = !!checklist[id];
    return stepCardHTML(step, i, id, isDone);
  }).join('')}</div>`;
  attachStepInteractions(container);
}

// === RENDER NIGHT CALENDAR ===
function renderNightCalendar() {
  const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const order    = [1,2,3,4,5,6,0];
  const container = document.getElementById('nightCalendar');
  container.innerHTML = `<div class="night-calendar">${order.map(i => {
    const s      = NIGHT_SCHEDULE[i];
    const isOlay = s.type === 'olay';
    return `
      <div class="night-row ${isOlay ? 'olay-night':'nia-night'}">
        <div class="night-day">${dayNames[i]}<span>${isOlay ? '✨ Noche Olay':'💚 Niacinamida'}</span></div>
        <div class="night-steps">
          <div class="night-step"><span class="night-step-label">🫧 Limpieza</span><span class="night-step-product">${s.cleanser}</span></div>
          <div class="night-step"><span class="night-step-label">💊 Sérum Cara</span><span class="night-step-product">${s.serum}</span></div>
          <div class="night-step"><span class="night-step-label">👁 Contorno Ojos</span><span class="night-step-product">${s.eyes}</span></div>
          <div class="night-step"><span class="night-step-label">🌙 Crema Final</span><span class="night-step-product">${s.cream}</span></div>
        </div>
      </div>`;
  }).join('')}</div>`;
}

// === RENDER TIPS ===
function renderTips() {
  const container = document.getElementById('tipsList');
  container.innerHTML = `<div class="tips-list">${TIPS.map(tip => `
    <div class="tip-card">
      <div class="tip-icon">${tip.icon}</div>
      <div class="tip-content"><h3>${tip.title}</h3><p>${tip.text}</p></div>
    </div>`).join('')}</div>`;
}

// =============================================
// === THEME SYSTEM (prefers-color-scheme + manual) ===
// =============================================
function initThemeSystem() {
  const mq  = window.matchMedia('(prefers-color-scheme: dark)');
  const btn = document.getElementById('themeToggle');

  // Determine initial theme
  if (manualTheme) {
    applyTheme(manualTheme);
  } else {
    applyTheme(mq.matches ? 'night' : 'day');
    autoThemeByTime(); // further refine by time if no manual override
  }

  // Listen for OS theme changes (only if no manual override)
  mq.addEventListener('change', e => {
    if (!manualTheme) applyTheme(e.matches ? 'night' : 'day');
  });

  // Manual toggle button — always takes priority
  if (btn) {
    btn.addEventListener('click', () => {
      const next     = currentTheme === 'day' ? 'night' : 'day';
      manualTheme    = next;
      localStorage.setItem(LS_THEME_MANUAL, next);
      applyTheme(next);
    });
  }

  // Long-press on toggle resets to system theme
  if (btn) {
    let pressTimer;
    btn.addEventListener('pointerdown', () => {
      pressTimer = setTimeout(() => {
        manualTheme = null;
        localStorage.removeItem(LS_THEME_MANUAL);
        applyTheme(mq.matches ? 'night' : 'day');
        btn.classList.add('haptic-pop');
        btn.addEventListener('animationend', () => btn.classList.remove('haptic-pop'), { once:true });
      }, 700);
    });
    btn.addEventListener('pointerup',   () => clearTimeout(pressTimer));
    btn.addEventListener('pointerleave',() => clearTimeout(pressTimer));
  }
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'night' ? '☀️' : '🌙';
}

function autoThemeByTime() {
  const h = new Date().getHours();
  if (h >= 20 || h < 7) applyTheme('night');
}

// =============================================
// === GLOW TRACKING (mouse / touch / tilt) ===
// =============================================
function initGlowTracking() {
  document.addEventListener('mousemove', e => handleGlowAt(e.clientX, e.clientY));
  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    handleGlowAt(t.clientX, t.clientY);
  }, { passive:true });

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', e => {
      const xPct = Math.min(Math.max(((e.gamma||0) + 45) / 90, 0), 1) * 100;
      const yPct = Math.min(Math.max(((e.beta ||0) - 10) / 80, 0), 1) * 100;
      document.querySelectorAll('.step-card:not(.completed)').forEach(card => {
        card.style.setProperty('--glow-pos',
          `radial-gradient(circle 90px at ${xPct}% ${yPct}%, rgba(255,255,255,0.14), transparent 70%)`);
      });
    }, { passive:true });
  }
}

function handleGlowAt(cx, cy) {
  const dayCard = document.querySelector('.day-card');
  if (dayCard) {
    const r       = dayCard.getBoundingClientRect();
    const x       = ((cx - r.left) / r.width  * 100).toFixed(1);
    const y       = ((cy - r.top)  / r.height * 100).toFixed(1);
    const overlay = dayCard.querySelector('.card-glow-overlay');
    if (overlay) overlay.style.background =
      `radial-gradient(circle 130px at ${x}% ${y}%, rgba(255,255,255,0.22), transparent 70%)`;
  }
  document.querySelectorAll('.step-card:not(.completed)').forEach(card => {
    const r = card.getBoundingClientRect();
    const x = ((cx - r.left) / r.width  * 100).toFixed(1);
    const y = ((cy - r.top)  / r.height * 100).toFixed(1);
    card.style.setProperty('--glow-pos',
      `radial-gradient(circle 80px at ${x}% ${y}%, rgba(255,255,255,0.12), transparent 70%)`);
  });
}

// === SERVICE WORKER ===
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}
