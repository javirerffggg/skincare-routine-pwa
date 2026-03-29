/**
 * GLASS TILT ENGINE
 * Efecto de inclinación 3D para tarjetas premium
 * Activado por: DeviceOrientation (móvil) + Pointer (desktop)
 * Simula reflección de cristal + haptic feedback al completar
 */

const TILT_MAX = 5; // grados máximo

/**
 * Inicializa el efecto Glass Tilt en todos los .ritual-card
 */
export function initGlassTilt() {
  // Giroscopio en móvil
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
  }

  // Pointer para desktop / precisión en touch
  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('pointerleave', resetAllTilt, { passive: true });
}

function getCards() {
  return document.querySelectorAll('.ritual-card');
}

function handleOrientation(e) {
  const cards = getCards();
  if (!cards.length) return;

  const x = Math.min(Math.max((e.gamma || 0) / 45 * TILT_MAX, -TILT_MAX), TILT_MAX);
  const y = Math.min(Math.max((e.beta  || 0) / 90 * TILT_MAX, -TILT_MAX), TILT_MAX);

  cards.forEach(card => applyTilt(card, x, y, 0.5, 0.5));
}

function handlePointerMove(e) {
  const card = e.target.closest('.ritual-card');
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const cx = (e.clientX - rect.left) / rect.width;
  const cy = (e.clientY - rect.top)  / rect.height;

  const x = (cx - 0.5) * 2 * TILT_MAX;
  const y = (cy - 0.5) * 2 * -TILT_MAX;

  applyTilt(card, x, y, cx, cy);
  card.classList.add('tilting');
}

function applyTilt(card, rotX, rotY, lightX, lightY) {
  card.style.transform = `perspective(800px) rotateX(${rotY}deg) rotateY(${rotX}deg)`;
  card.style.setProperty('--tilt-x', `${lightX * 100}%`);
  card.style.setProperty('--tilt-y', `${lightY * 100}%`);
}

function resetAllTilt() {
  const cards = getCards();
  cards.forEach(card => {
    card.style.transform = '';
    card.classList.remove('tilting');
  });
}

/**
 * Trigger háptico al completar un paso — simula cierre de envase de lujo
 * navigator.vibrate([10, 20, 10])
 */
export function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 20, 10]);
  }
}

/**
 * Animación de entrada escalonada para las cards
 * Retraso de 80ms entre cada card
 * @param {NodeList|Array} cards
 */
export function initStaggeredEntrance(cards) {
  cards.forEach((card, i) => {
    card.style.setProperty('--card-delay', `${i * 80}ms`);
  });
}
