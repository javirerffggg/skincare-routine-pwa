'use strict';

// =====================================================
// ATMOSPHERIC LAYER — atmosphere.js
// 1. WebGL Mesh Gradient (replaces flat CSS background)
// 2. Depth Parallax (gyroscope / mouse)
// =====================================================

// ---- 1. WEBGL MESH GRADIENT -----------------------

const VERT_SRC = `
precision mediump float;
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_c0;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;
uniform float u_dark;

// smooth noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t  = u_time * 0.18;

  // 4 organic control points that drift over time
  vec2 p0 = vec2(0.5 + 0.45*sin(t*0.9),   0.5 + 0.45*cos(t*0.7));
  vec2 p1 = vec2(0.5 + 0.45*cos(t*1.1),   0.5 + 0.45*sin(t*1.3));
  vec2 p2 = vec2(0.5 + 0.40*sin(t*0.7+1.5),0.5 + 0.40*cos(t*0.9+2.0));
  vec2 p3 = vec2(0.5 + 0.40*cos(t*1.2+0.8),0.5 + 0.40*sin(t*0.6+1.2));

  // Distance-based influence of each control point
  float d0 = 1.0 / (length(uv - p0) * 4.0 + 0.001);
  float d1 = 1.0 / (length(uv - p1) * 4.0 + 0.001);
  float d2 = 1.0 / (length(uv - p2) * 4.0 + 0.001);
  float d3 = 1.0 / (length(uv - p3) * 4.0 + 0.001);
  float total = d0 + d1 + d2 + d3;

  vec3 col = (u_c0*d0 + u_c1*d1 + u_c2*d2 + u_c3*d3) / total;

  // Add subtle organic noise warp
  float n = noise(uv * 3.0 + vec2(t * 0.3, t * 0.25)) * 0.06;
  col = clamp(col + vec3(n * (1.0 - u_dark * 0.8)), 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

// Phase color palettes [c0, c1, c2, c3] as [r,g,b] 0-1
const PHASE_COLORS = {
  dawn:  [[0.98,0.85,0.90], [0.80,0.88,0.99], [0.92,0.84,0.97], [0.99,0.96,0.88]],
  day:   [[0.88,0.94,1.00], [0.98,0.97,0.84], [0.82,0.96,0.98], [0.96,0.98,1.00]],
  dusk:  [[1.00,0.87,0.72], [0.96,0.78,0.88], [1.00,0.72,0.62], [0.98,0.92,0.78]],
  night: [[0.08,0.07,0.18], [0.12,0.09,0.28], [0.06,0.08,0.22], [0.10,0.06,0.20]],
};

let _gl = null, _prog = null, _locs = {}, _raf = null;
let _targetColors = PHASE_COLORS.dawn;
let _currentColors = PHASE_COLORS.dawn.map(c => [...c]);
let _lastTime = 0;

function initWebGLMesh() {
  const canvas = document.getElementById('meshCanvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) { canvas.style.display = 'none'; return; } // fallback graceful
  _gl = gl;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SRC));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_SRC));
  gl.linkProgram(prog);
  _prog = prog;
  gl.useProgram(prog);

  // Full-screen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  _locs = {
    res:  gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    c0:   gl.getUniformLocation(prog, 'u_c0'),
    c1:   gl.getUniformLocation(prog, 'u_c1'),
    c2:   gl.getUniformLocation(prog, 'u_c2'),
    c3:   gl.getUniformLocation(prog, 'u_c3'),
    dark: gl.getUniformLocation(prog, 'u_dark'),
  };

  resizeMesh();
  window.addEventListener('resize', resizeMesh, { passive: true });
  _raf = requestAnimationFrame(renderMesh);
}

function resizeMesh() {
  const canvas = document.getElementById('meshCanvas');
  if (!canvas || !_gl) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  _gl.viewport(0, 0, canvas.width, canvas.height);
}

function renderMesh(ts) {
  if (!_gl || !_prog) return;
  _raf = requestAnimationFrame(renderMesh);
  const dt = Math.min((ts - _lastTime) / 1000, 0.1);
  _lastTime = ts;

  // Interpolate colors toward target
  const speed = 0.012;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      _currentColors[i][j] += (_targetColors[i][j] - _currentColors[i][j]) * speed;
    }
  }

  const isDark = document.documentElement.getAttribute('data-phase') === 'night' ||
                 document.documentElement.getAttribute('data-theme') === 'night';

  const canvas = document.getElementById('meshCanvas');
  _gl.uniform2f(_locs.res, canvas.width, canvas.height);
  _gl.uniform1f(_locs.time, ts * 0.001);
  _gl.uniform3fv(_locs.c0, _currentColors[0]);
  _gl.uniform3fv(_locs.c1, _currentColors[1]);
  _gl.uniform3fv(_locs.c2, _currentColors[2]);
  _gl.uniform3fv(_locs.c3, _currentColors[3]);
  _gl.uniform1f(_locs.dark, isDark ? 1.0 : 0.0);
  _gl.drawArrays(_gl.TRIANGLE_STRIP, 0, 4);
}

/** Call from circadian engine when phase changes */
window.setMeshPhase = function(phaseId) {
  _targetColors = PHASE_COLORS[phaseId] || PHASE_COLORS.dawn;
};

// ---- 2. DEPTH PARALLAX ----------------------------

const PARALLAX_LAYERS = [
  { selector: '.aura-bg',    depth: 0.08 },  // background moves least
  { selector: '#meshCanvas', depth: 0.06 },
  { selector: '.orb-1',      depth: 0.14 },
  { selector: '.orb-2',      depth: 0.10 },
  { selector: '.orb-3',      depth: 0.12 },
];

let _gyroX = 0, _gyroY = 0;
let _mouseX = 0, _mouseY = 0;
let _parallaxRaf = null;

function initParallax() {
  const hasGyro = typeof DeviceOrientationEvent !== 'undefined';

  if (hasGyro) {
    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // We try silently; if denied, mouse fallback takes over
      DeviceOrientationEvent.requestPermission()
        .then(s => { if (s === 'granted') bindGyro(); })
        .catch(() => {});
    } else {
      bindGyro();
    }
  }

  // Mouse/touch fallback (also used on desktop)
  document.addEventListener('mousemove', e => {
    _mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    _mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    _mouseX = (t.clientX / window.innerWidth  - 0.5) * 2;
    _mouseY = (t.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  _parallaxRaf = requestAnimationFrame(tickParallax);
}

function bindGyro() {
  window.addEventListener('deviceorientation', e => {
    // gamma = left/right tilt (-90 to 90), beta = front/back tilt (-180 to 180)
    _gyroX = Math.max(-1, Math.min(1, (e.gamma || 0) / 30));
    _gyroY = Math.max(-1, Math.min(1, ((e.beta  || 0) - 30) / 40));
  }, { passive: true });
}

let _pCurrent = { x: 0, y: 0 };
function tickParallax() {
  _parallaxRaf = requestAnimationFrame(tickParallax);

  // Blend gyro + mouse (gyro dominates on mobile)
  const tx = _gyroX !== 0 ? _gyroX : _mouseX;
  const ty = _gyroY !== 0 ? _gyroY : _mouseY;

  // Smooth lerp
  _pCurrent.x += (tx - _pCurrent.x) * 0.05;
  _pCurrent.y += (ty - _pCurrent.y) * 0.05;

  const px = _pCurrent.x;
  const py = _pCurrent.y;
  const MAX_PX = 28; // max pixel shift

  PARALLAX_LAYERS.forEach(({ selector, depth }) => {
    const els = document.querySelectorAll(selector);
    els.forEach(el => {
      const dx = (-px * depth * MAX_PX).toFixed(2);
      const dy = (-py * depth * MAX_PX).toFixed(2);
      el.style.transform = `translate3d(${dx}px,${dy}px,0)`;
    });
  });
}

// ---- INIT (called from app.js DOMContentLoaded) ----
window.initAtmosphere = function() {
  initWebGLMesh();
  initParallax();
};
