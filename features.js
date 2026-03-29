'use strict';

// =====================================================
// features.js — Signature UX Modules
//
// 1. Progress Ring de Cristal
// 2. Iconografía Morfólogica (icon touch animations)
// 3. Contextual Weather Shader (lluvia en Cádiz)
// 4. Tilt 3D (perspectiva en cards al deslizar)
// 5. Floating Dock sync con tabs
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  initProgressRing();
  initIconMorphology();
  initWeatherShader();
  initTilt3D();
  initFloatingDock();
});

// =====================================================
// 1. PROGRESS RING DE CRISTAL
// Anillo SVG que se llena como un tubo de vidrio
// con líquido dorado/rosado al completar pasos.
// =====================================================
const RING_CIRCUMFERENCE = 175.93; // 2 * PI * 28
const LS_STREAK = 'tg_streak';

function initProgressRing() {
  updateProgressRing();

  // Escuchar clicks en step-cards para actualizar el anillo
  document.addEventListener('click', e => {
    if (e.target.closest('.step-card')) {
      // Esperar al siguiente tick para que el checklist se actualice
      setTimeout(updateProgressRing, 60);
    }
  });
}

function updateProgressRing() {
  const liquid  = document.getElementById('ringLiquid');
  const count   = document.getElementById('ringCount');
  const bubble  = document.getElementById('ringBubble');
  const infoSub = document.getElementById('ringInfoSub');
  const streak  = document.getElementById('ringStreak');
  if (!liquid || !count) return;

  // Contar total de pasos y completados visibles en #tab-hoy
  const allCards   = document.querySelectorAll('#tab-hoy .step-card');
  const doneCards  = document.querySelectorAll('#tab-hoy .step-card.completed');
  const total      = allCards.length || 1;
  const done       = doneCards.length;
  const pct        = done / total;

  // Stroke-dashoffset: 0 = lleno, CIRCUMFERENCE = vacío
  const offset = RING_CIRCUMFERENCE * (1 - pct);
  liquid.style.strokeDashoffset = offset.toFixed(2);

  // Actualizar gradiente según fase
  const phase = document.documentElement.getAttribute('data-phase');
  const theme = document.documentElement.getAttribute('data-theme');
  let gradId = 'ringGradient';
  if (phase === 'day') gradId = 'ringGradientDay';
  if (phase === 'night' || theme === 'night') gradId = 'ringGradientNight';
  liquid.setAttribute('stroke', `url(#${gradId})`);

  // Texto central
  count.textContent = `${done}/${total}`;

  // Burbuja activa cuando hay progreso
  if (done > 0 && done < total) {
    bubble.classList.add('active');
    // Posicionar la burbuja en el extremo del líquido
    const angle = (pct * 360 - 90) * (Math.PI / 180);
    const bx = (34 + 28 * Math.cos(angle)).toFixed(2);
    const by = (34 + 28 * Math.sin(angle)).toFixed(2);
    bubble.setAttribute('cx', bx);
    bubble.setAttribute('cy', by);
  } else {
    bubble.classList.remove('active');
  }

  // Mensaje contextual
  if (done === 0) {
    infoSub.textContent = 'Empieza tu rutina y rellena el anillo 💧';
  } else if (done === total) {
    infoSub.textContent = '✨ ¡Rutina completada! Tu piel te lo agradecerá';
    triggerRingComplete();
  } else {
    infoSub.textContent = `${total - done} paso${total-done>1?'s':''} más para completar tu rutina`;
  }

  // Racha
  updateStreak(done === total, streak);
}

function updateStreak(completed, el) {
  if (!el) return;
  try {
    const raw = JSON.parse(localStorage.getItem(LS_STREAK) || 'null');
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streak = 1;
    if (raw) {
      if (raw.last === today) {
        streak = raw.count;
      } else if (raw.last === yesterday && completed) {
        streak = raw.count + 1;
        localStorage.setItem(LS_STREAK, JSON.stringify({ last: today, count: streak }));
      } else if (completed) {
        localStorage.setItem(LS_STREAK, JSON.stringify({ last: today, count: 1 }));
      } else {
        streak = raw.count || 1;
      }
    } else if (completed) {
      localStorage.setItem(LS_STREAK, JSON.stringify({ last: today, count: 1 }));
    }
    el.textContent = `✨ Racha: ${streak} día${streak>1?'s':''}`;
  } catch (_) {}
}

function triggerRingComplete() {
  const svg = document.getElementById('progressRingSvg');
  if (!svg || svg.dataset.celebrated === 'true') return;
  svg.dataset.celebrated = 'true';
  // Breve pulso de celebración
  svg.style.transition = 'filter 0.4s';
  svg.style.filter = 'drop-shadow(0 0 18px rgba(255,180,120,0.90))';
  setTimeout(() => { svg.style.filter = 'drop-shadow(0 4px 16px rgba(196,138,150,0.40))'; }, 900);
  if (navigator.vibrate) navigator.vibrate([20, 40, 20, 40, 60]);
  // Reset al siguiente día
  const resetKey = 'tg_ring_celebrated_' + new Date().toISOString().slice(0,10);
  localStorage.setItem(resetKey, '1');
}

// =====================================================
// 2. ICONOGRAFÍA MORFÓLOGICA
// Cada icono tiene una animación distinta al tocarlo.
// El sol gira, la gota tiembla, el escudo pulsa, etc.
// =====================================================
const ICON_ANIM_MAP = {
  '🫧': 'icon-drop-anim',    // limpieza = gota
  '💧': 'icon-drop-anim',    // hidratación = gota
  '🛡': 'icon-shield-anim',  // SPF = escudo
  '👁':  'icon-eye-anim',     // contorno ojos
  '💚': 'icon-star-anim',    // sérum verde
  '🚫': 'icon-moon-anim',    // descanso
  '🌙': 'icon-moon-anim',    // noche
  '☀️': 'icon-sun-anim',     // sol
};

function initIconMorphology() {
  // Delegar desde el documento para capturar cards renderizados dinámicamente
  document.addEventListener('pointerdown', e => {
    const stepNum = e.target.closest('.step-number');
    const tipIcon = e.target.closest('.tip-icon');
    const target  = stepNum || tipIcon;
    if (!target) return;

    const emoji  = target.textContent.trim();
    const animClass = ICON_ANIM_MAP[emoji];
    if (!animClass) return;

    // Quitar la clase y re-añadir para reiniciar la animación
    target.classList.remove(...Object.values(ICON_ANIM_MAP));
    void target.offsetWidth; // force reflow
    target.classList.add(animClass);
    target.addEventListener('animationend', () => target.classList.remove(animClass), { once: true });
  });
}

// =====================================================
// 3. CONTEXTUAL WEATHER SHADER
// Llama a Open-Meteo (sin API key) con coords de Cádiz.
// Si hay precipitación, activa gotas digitales bluréadas
// en el canvas de fondo. Totalmente sutil.
// =====================================================
const CADIZ_LAT  =  36.5271;
const CADIZ_LON  = -6.2886;
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${CADIZ_LAT}&longitude=${CADIZ_LON}` +
  `&current=precipitation,weather_code&timezone=Europe%2FMadrid`;

let _weatherRaf = null;
let _rainDrops  = [];
let _isRaining  = false;

function initWeatherShader() {
  const canvas = document.getElementById('weatherCanvas');
  if (!canvas) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }, { passive: true });

  fetchWeather();
  // Re-chequear cada 15 minutos
  setInterval(fetchWeather, 15 * 60 * 1000);
}

async function fetchWeather() {
  try {
    const res  = await fetch(WEATHER_URL, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    const precip = data?.current?.precipitation ?? 0;
    const code   = data?.current?.weather_code  ?? 0;
    // WMO codes 51-99 incluyen lluvia/chubascos/tormenta
    const rain = precip > 0.1 || (code >= 51 && code <= 99);
    setRaining(rain);
  } catch (_) {
    // Silencioso: no hay error visible al usuario
  }
}

function setRaining(rain) {
  _isRaining = rain;
  const canvas = document.getElementById('weatherCanvas');
  if (!canvas) return;

  if (rain) {
    canvas.classList.add('raining');
    if (!_weatherRaf) startRainAnimation(canvas);
  } else {
    canvas.classList.remove('raining');
    if (_weatherRaf) {
      cancelAnimationFrame(_weatherRaf);
      _weatherRaf = null;
      _rainDrops  = [];
    }
  }
}

function createRainDrop(canvas) {
  return {
    x:       Math.random() * canvas.width,
    y:       Math.random() * -canvas.height,
    length:  12 + Math.random() * 22,
    speed:   2.5 + Math.random() * 3.5,
    opacity: 0.04 + Math.random() * 0.09,
    blur:    2 + Math.random() * 4,
    width:   0.6 + Math.random() * 0.8,
    angle:   0.12 + Math.random() * 0.08, // leve inclinación
  };
}

function startRainAnimation(canvas) {
  const ctx     = canvas.getContext('2d');
  const COUNT   = Math.floor(canvas.width / 12); // densidad adaptativa
  _rainDrops    = Array.from({ length: COUNT }, () => createRainDrop(canvas));

  function frame() {
    _weatherRaf = requestAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    _rainDrops.forEach(d => {
      // Mover la gota
      d.y += d.speed;
      d.x += d.angle * d.speed;

      // Reciclar cuando sale de pantalla
      if (d.y > canvas.height + 20) {
        Object.assign(d, createRainDrop(canvas));
      }

      // Dibujar gota con blur suave
      ctx.save();
      ctx.globalAlpha = d.opacity;
      ctx.filter      = `blur(${d.blur}px)`;

      // Determinar color según fase
      const phase = document.documentElement.getAttribute('data-phase');
      const theme = document.documentElement.getAttribute('data-theme');
      let dropColor;
      if (phase === 'night' || theme === 'night') {
        dropColor = 'rgba(160,140,220,1)';
      } else if (phase === 'dusk') {
        dropColor = 'rgba(220,160,100,1)';
      } else if (phase === 'day') {
        dropColor = 'rgba(120,190,240,1)';
      } else {
        dropColor = 'rgba(200,170,200,1)';
      }

      ctx.strokeStyle = dropColor;
      ctx.lineWidth   = d.width;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.angle * d.length, d.y + d.length);
      ctx.stroke();
      ctx.restore();
    });
  }
  frame();
}

// Exponer para testing manual desde consola
window.testRain = (on = true) => setRaining(on);

// =====================================================
// 4. TILT 3D — Efecto perspectiva al deslizar el dedo
// Las cards rotan en X e Y siguiendo al cursor/dedo.
// Al soltar, vuelven con el spring Bézier.
// =====================================================
const TILT_MAX    = 8;   // grados máximos de rotación
const TILT_LIFT   = -3;  // px de elevación
const TILT_SCALE  = 1.025;

function initTilt3D() {
  // Usar event delegation para cards generados dinámicamente
  document.addEventListener('pointermove',  onTiltMove, { passive: true });
  document.addEventListener('pointerleave', onTiltLeaveDoc, { passive: true });
  document.addEventListener('pointerup',    onTiltLeaveDoc, { passive: true });
}

function onTiltMove(e) {
  // Encontrar la card más cercana al puntero
  const card = e.target.closest('.step-card, .tip-card, .night-row');
  if (!card) {
    // Si no está sobre ninguna card, reset la última
    resetAllTilt();
    return;
  }

  const rect   = card.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;

  // Normalizado -1 a 1
  const nx = (e.clientX - cx) / (rect.width  / 2);
  const ny = (e.clientY - cy) / (rect.height / 2);

  const rotY =  nx * TILT_MAX;  // positivo = gira hacia la derecha
  const rotX = -ny * TILT_MAX;  // negativo = eleva el borde superior

  // Aplicar via CSS custom properties (más eficiente que inline transform)
  card.style.setProperty('--tilt-x',     `${rotX.toFixed(2)}deg`);
  card.style.setProperty('--tilt-y',     `${rotY.toFixed(2)}deg`);
  card.style.setProperty('--tilt-lift',  `${TILT_LIFT}px`);
  card.style.setProperty('--tilt-scale', TILT_SCALE);
  card.style.transition = 'transform 0.06s linear, box-shadow 0.06s linear';

  // Brillo especular que sigue al dedo
  const glare = card.querySelector('.tilt-glare');
  if (glare) {
    const gx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
    const gy = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
    glare.style.setProperty('--glare-x', `${gx}%`);
    glare.style.setProperty('--glare-y', `${gy}%`);
    glare.style.setProperty('--glare-opacity', '1');
  }

  // Marcar la card activa
  card.dataset.tiltActive = 'true';
}

function onTiltLeaveDoc() {
  resetAllTilt();
}

function resetAllTilt() {
  document.querySelectorAll('[data-tilt-active="true"]').forEach(card => {
    card.removeAttribute('data-tilt-active');
    card.style.setProperty('--tilt-x',     '0deg');
    card.style.setProperty('--tilt-y',     '0deg');
    card.style.setProperty('--tilt-lift',  '0px');
    card.style.setProperty('--tilt-scale', '1');
    // Restaurar la transición spring para el retroceso
    card.style.transition = '';
    const glare = card.querySelector('.tilt-glare');
    if (glare) glare.style.setProperty('--glare-opacity', '0');
  });
}

// Inyectar .tilt-glare en todas las cards (incluyendo las generadas dinámicamente)
const _glareObserver = new MutationObserver(muts => {
  muts.forEach(m => m.addedNodes.forEach(node => {
    if (node.nodeType !== 1) return;
    const cards = [
      ...(node.matches?.('.step-card, .tip-card, .night-row') ? [node] : []),
      ...node.querySelectorAll?.('.step-card, .tip-card, .night-row') ?? [],
    ];
    cards.forEach(injectGlare);
  }));
});
_glareObserver.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });

function injectGlare(card) {
  if (!card.querySelector('.tilt-glare')) {
    const glare = document.createElement('div');
    glare.className = 'tilt-glare';
    card.appendChild(glare);
  }
}

// =====================================================
// 5. FLOATING DOCK — Sync con system de tabs
// El dock replica la funcionalidad del .tab-nav original
// pero con el nuevo HTML flotante.
// =====================================================
function initFloatingDock() {
  const dock = document.querySelector('.floating-dock');
  if (!dock) return;

  const dockBtns = dock.querySelectorAll('.dock-btn[data-tab]');
  const tabBtns  = document.querySelectorAll('.tab-btn[data-tab]');

  dockBtns.forEach(dBtn => {
    dBtn.addEventListener('click', () => {
      const tab = dBtn.dataset.tab;

      // Activar en el dock
      dockBtns.forEach(b => b.classList.remove('active'));
      dBtn.classList.add('active');

      // Sincronizar con los tab-btns originales (que tienen la lógica de transición)
      const matching = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
      if (matching) matching.click();

      // Micro-animación del icono del dock
      const icon = dBtn.querySelector('.dock-icon');
      if (icon) {
        icon.style.transform = 'scale(1.35)';
        setTimeout(() => { icon.style.transform = ''; }, 280);
      }
    });
  });

  // Sync inverso: cuando se toca un tab-btn original, actualizar el dock
  tabBtns.forEach(tBtn => {
    tBtn.addEventListener('click', () => {
      const tab = tBtn.dataset.tab;
      dockBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    });
  });
}
