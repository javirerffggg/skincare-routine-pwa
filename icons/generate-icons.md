# Generar Iconos para la PWA

Para que la PWA funcione correctamente en iPhone necesitas dos iconos:

## Iconos requeridos
- `icon-192.png` — 192×192 px
- `icon-512.png` — 512×512 px

## Cómo generarlos rápido

### Opción 1: Online (más fácil)
Ve a [https://realfavicongenerator.net](https://realfavicongenerator.net) y sube cualquier imagen cuadrada.

### Opción 2: Con ImageMagick
```bash
convert icon-512.png -resize 192x192 icon-192.png
```

### Opción 3: Usa los SVG incluidos
Este repo incluye `icon.svg`. Convierte con Inkscape:
```bash
inkscape icon.svg --export-png=icons/icon-512.png -w 512 -h 512
inkscape icon.svg --export-png=icons/icon-192.png -w 192 -h 192
```

## Color de fondo sugerido
`#f06292` (rosa skincare)
