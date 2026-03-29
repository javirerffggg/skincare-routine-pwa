'use strict';

// === DATA ===
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const MORNING_STEPS = {
  invierno: [
    { label: 'Limpieza', product: 'CeraVe Hydrating', note: 'Solo para quitar el sudor de la noche. Agua fresca también vale.', icon: '🫧', color: 'step-blue' },
    { label: 'Contorno de Ojos', product: 'L\'Oréal Roll-on', note: '💡 Truco: Guárdalo en la nevera para deshinchar.', icon: '👁', color: 'step-purple' },
    { label: 'Hidratación', product: 'Crema Akytania', note: 'En invierno la piel necesita más barrera protectora.', icon: '💧', color: 'step-pink' },
    { label: 'Protección Solar', product: 'Garnier Super UV Fluido SPF 50', note: '⚠️ Obligatorio siempre. Agita el bote antes de usar. ¡Cuello y orejas también!', icon: '🛡', color: 'step-gold' },
  ],
  verano: [
    { label: 'Limpieza', product: 'CeraVe Hydrating o agua fresca', note: 'Solo para quitar el sudor de la noche.', icon: '🫧', color: 'step-blue' },
    { label: 'Contorno de Ojos', product: 'L\'Oréal Roll-on', note: '💡 Truco: Guárdalo en la nevera para deshinchar.', icon: '👁', color: 'step-purple' },
    { label: 'Hidratación', product: 'Gel L\'Oréal o NADA', note: 'En verano el protector solar ya hidrata bastante.', icon: '💧', color: 'step-pink' },
    { label: 'Protección Solar', product: 'Garnier Super UV Fluido SPF 50', note: '⚠️ Obligatorio siempre. Agita el bote antes de usar. ¡Cuello y orejas también!', icon: '🛡', color: 'step-gold' },
  ],
};

// 0=Sun,1=Mon,...,6=Sat
const NIGHT_SCHEDULE = [
  // Sun=0
  { type: 'nia', cleanser: 'Solimo Carbón', serum: 'Niacinamida T.O. (3 gotas)', eyes: 'Beauty of Joseon', cream: 'Akytania o Cien Q10' },
  // Mon=1
  { type: 'nia', cleanser: 'Solimo Carbón', serum: 'Niacinamida T.O. (3 gotas)', eyes: 'Beauty of Joseon', cream: 'Akytania o Cien Q10' },
  // Tue=2
  { type: 'nia', cleanser: 'Solimo Carbón', serum: 'Niacinamida T.O. (3 gotas)', eyes: 'Beauty of Joseon', cream: 'Akytania o Cien Q10' },
  // Wed=3
  { type: 'olay', cleanser: 'CeraVe (Suave)', serum: '❌ NADA', eyes: 'Beauty of Joseon', cream: 'Olay Vit C + AHA' },
  // Thu=4
  { type: 'nia', cleanser: 'Solimo Carbón', serum: 'Niacinamida T.O. (3 gotas)', eyes: 'Beauty of Joseon', cream: 'Akytania o Cien Q10' },
  // Fri=5
  { type: 'nia', cleanser: 'Solimo Carbón', serum: 'Niacinamida T.O. (3 gotas)', eyes: 'Beauty of Joseon', cream: 'Akytania o Cien Q10' },
  // Sat=6
  { type: 'olay', cleanser: 'CeraVe (Suave)', serum: '❌ NADA', eyes: 'Beauty of Joseon', cream: 'Olay Vit C + AHA' },
];

const TIPS = [
  { icon: '⚠️', title: 'Regla Olay (Mié y Sáb)', text: 'Esas noches NUNCA uses la Niacinamida de The Ordinary. La crema Olay ya es el tratamiento completo por sí sola.' },
  { icon: '👆', title: 'Margen de Seguridad Olay', text: 'Cuando te pongas la crema Olay, no la acerques demasiado a los ojos (donde ya tienes el Beauty of Joseon). Deja un dedo de distancia.' },
  { icon: '💧', title: 'Cantidad de Niacinamida', text: 'Con 3 gotas para toda la cara es suficiente. Si usas más, te saldrán "pelotillas" blancas al poner la crema después.' },
  { icon: '🦒', title: 'Cuello y Orejas', text: '¡No los olvides! Especialmente con el protector solar por la mañana. Son las zonas más olvidadas y las que más envejecen.' },
  { icon: '🔢', title: 'Orden Contorno BoJ', text: 'Siempre pon el Beauty of Joseon antes de tu crema de noche (Cien, Akytania u Olay). Sérum → Contorno → Crema.' },
  { icon: '🧊', title: 'Truco del Roll-on', text: 'Guarda el L\'Oréal Roll-on en la nevera. El frío ayuda a deshinchar las ojeras muchísimo más. ¡Marca la diferencia!' },
  { icon: '🌅', title: 'SPF, siempre', text: 'El Garnier Super UV SPF 50 es obligatorio todos los días, aunque esté nublado. La radiación UV atraviesa las nubes.' },
];

// === STATE ===
let season = 'invierno';
let seasonManana = 'invierno';

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initTabs();
  renderHoy();
  renderManana();
  renderNightCalendar();
  renderTips();
  initServiceWorker();
});

// === DATE ===
function initDate() {
  const now = new Date();
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
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

// === RENDER HOY ===
function renderHoy() {
  const now = new Date();
  const dow = now.getDay();
  document.getElementById('dayBadge').textContent = DAYS_SHORT[dow];
  document.getElementById('dayTitle').textContent = DAYS[dow];

  renderMorningSteps('morningRoutine', season);
  renderNightToday(dow);
}

function renderMorningSteps(containerId, s) {
  const container = document.getElementById(containerId);
  const steps = MORNING_STEPS[s];
  container.innerHTML = steps.map((step, i) => `
    <div class="step-card ${step.color}">
      <div class="step-number">${step.icon}</div>
      <div class="step-info">
        <div class="step-label">Paso ${i + 1} — ${step.label}</div>
        <div class="step-product">${step.product}</div>
        <div class="step-note">${step.note}</div>
      </div>
    </div>
  `).join('');
}

function renderNightToday(dow) {
  const schedule = NIGHT_SCHEDULE[dow];
  const container = document.getElementById('nightRoutine');
  const alertBox = document.getElementById('nightAlert');

  const isOlay = schedule.type === 'olay';

  const steps = [
    { label: 'Limpieza', product: schedule.cleanser, icon: '🫧', color: 'step-blue' },
    { label: isOlay ? 'Sérum — DESCANSO' : 'Sérum Cara', product: schedule.serum, icon: isOlay ? '🚫' : '💚', color: isOlay ? 'step-purple' : 'step-green' },
    { label: 'Contorno Ojos', product: schedule.eyes, icon: '👁', color: 'step-purple' },
    { label: 'Crema Final', product: schedule.cream, icon: '🌙', color: 'step-pink' },
  ];

  container.innerHTML = steps.map((step, i) => `
    <div class="step-card ${step.color}">
      <div class="step-number">${step.icon}</div>
      <div class="step-info">
        <div class="step-label">Paso ${i + 1} — ${step.label}</div>
        <div class="step-product">${step.product}</div>
      </div>
    </div>
  `).join('');

  if (isOlay) {
    alertBox.innerHTML = '<strong>⚠️ Noche Olay</strong>Recuerda: NO uses Niacinamida esta noche. La Olay ya es el tratamiento completo. Deja 1 dedo de distancia de la zona de ojos.';
    alertBox.classList.add('show');
  } else {
    alertBox.classList.remove('show');
  }
}

// === SEASON TOGGLE ===
window.setSeason = function(s) {
  season = s;
  document.getElementById('btnInvierno').classList.toggle('active', s === 'invierno');
  document.getElementById('btnVerano').classList.toggle('active', s === 'verano');
  renderMorningSteps('morningRoutine', s);
};

window.setSeasonManana = function(s) {
  seasonManana = s;
  document.getElementById('btnInviernoM').classList.toggle('active', s === 'invierno');
  document.getElementById('btnVeranoM').classList.toggle('active', s === 'verano');
  renderManana();
};

// === RENDER MAÑANA ===
function renderManana() {
  const container = document.getElementById('morningFullList');
  const steps = MORNING_STEPS[seasonManana];
  container.innerHTML = `
    <div class="routine-list">
      ${steps.map((step, i) => `
        <div class="step-card ${step.color}">
          <div class="step-number">${step.icon}</div>
          <div class="step-info">
            <div class="step-label">Paso ${i + 1} — ${step.label}</div>
            <div class="step-product">${step.product}</div>
            <div class="step-note">${step.note}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// === RENDER NIGHT CALENDAR ===
function renderNightCalendar() {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  // Reorder to Mon–Sun
  const order = [1, 2, 3, 4, 5, 6, 0];
  const container = document.getElementById('nightCalendar');
  container.innerHTML = `<div class="night-calendar">${order.map(i => {
    const s = NIGHT_SCHEDULE[i];
    const isOlay = s.type === 'olay';
    return `
      <div class="night-row ${isOlay ? 'olay-night' : 'nia-night'}">
        <div class="night-day">
          ${dayNames[i]}
          <span>${isOlay ? '✨ Noche Olay' : '💚 Niacinamida'}</span>
        </div>
        <div class="night-steps">
          <div class="night-step">
            <span class="night-step-label">🫧 Limpieza</span>
            <span class="night-step-product">${s.cleanser}</span>
          </div>
          <div class="night-step">
            <span class="night-step-label">💊 Sérum Cara</span>
            <span class="night-step-product">${s.serum}</span>
          </div>
          <div class="night-step">
            <span class="night-step-label">👁 Contorno Ojos</span>
            <span class="night-step-product">${s.eyes}</span>
          </div>
          <div class="night-step">
            <span class="night-step-label">🌙 Crema Final</span>
            <span class="night-step-product">${s.cream}</span>
          </div>
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

// === RENDER TIPS ===
function renderTips() {
  const container = document.getElementById('tipsList');
  container.innerHTML = `<div class="tips-list">${TIPS.map(tip => `
    <div class="tip-card">
      <div class="tip-icon">${tip.icon}</div>
      <div class="tip-content">
        <h3>${tip.title}</h3>
        <p>${tip.text}</p>
      </div>
    </div>
  `).join('')}</div>`;
}

// === SERVICE WORKER ===
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}
