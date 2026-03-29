# ✨ Skincare Routine PWA

Aplicación web progresiva (PWA) para gestionar tu **Plan Maestro de Skincare** personalizado.
Diseñada y optimizada para **iPhone 13 Pro Max**.

## 🚀 Funcionalidades

- **🗓 Tab Hoy** — Muestra la rutina exacta del día (mañana + noche), detectando automáticamente qué día es.
- **☀️ Tab Mañana** — Pasos completos de la rutina de mañana con toggle Invierno/Verano.
- **🌙 Tab Noche** — Calendario semanal completo con la alternancia Niacinamida / Olay.
- **💡 Tab Tips** — Los 7 recordatorios de oro siempre accesibles.
- **Toggle Invierno/Verano** — Cambia la hidratación de mañana según la temporada en Cádiz.
- **Alerta Olay** — Aviso automático los miércoles y sábados para no mezclar con Niacinamida.
- **100% Offline** — Service Worker con cache-first para usar sin conexión.

## 📱 Instalar en iPhone

1. Abre Safari y ve a la URL del sitio.
2. Toca el botón **Compartir** (cuadrado con flecha).
3. Selecciona **"Añadir a pantalla de inicio"**.
4. Ponle nombre y toca **Añadir**.
5. ¡Ya tienes el icono en tu pantalla!

## 🗂 Estructura de archivos

```
skincare-routine-pwa/
├── index.html       # Estructura principal
├── style.css        # Diseño iOS-style optimizado para iPhone 13 Pro Max
├── app.js           # Lógica: rutinas, tabs, toggles, calendario
├── manifest.json    # Configuración PWA
├── sw.js            # Service Worker (offline)
├── icons/
│   ├── icon.svg     # Icono fuente
│   ├── icon-192.png # Icono PWA pequeño
│   ├── icon-512.png # Icono PWA grande
│   └── generate-icons.md
└── README.md
```

## 🌸 Rutina incluida

### ☀️ Mañanas (Lunes–Domingo)
| Paso | Invierno | Verano |
|------|----------|--------|
| 1. Limpieza | CeraVe Hydrating | CeraVe / agua fresca |
| 2. Ojos | L'Oréal Roll-on ❄️ nevera | L'Oréal Roll-on ❄️ nevera |
| 3. Hidratación | Crema Akytania | Gel L'Oréal o NADA |
| 4. Solar | Garnier Super UV SPF50 | Garnier Super UV SPF50 |

### 🌙 Noches
| Día | Tipo | Sérum |
|-----|------|-------|
| Lunes, Martes, Jueves, Viernes, Domingo | 💚 Niacinamida | The Ordinary |
| Miércoles, Sábado | ✨ Olay | ❌ Sin Niacinamida |

## 🛠 Deploy con GitHub Pages

1. Ve a **Settings → Pages**.
2. En **Source**, selecciona `main` branch, carpeta `/ (root)`.
3. Guarda y espera 1-2 minutos.
4. Tu app estará en: `https://javirerffggg.github.io/skincare-routine-pwa/`

> ⚠️ Para que el Service Worker funcione en GitHub Pages, asegúrate de usar la URL HTTPS.
