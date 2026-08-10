# Design System & UI Architecture Specification (`DESIGN.md`)

Este documento especifica las guías de diseño, paleta de colores, tipografías, componentes UI reutilizables y patrones de animación del proyecto **Agentic**. Está optimizado como referencia técnica para agentes de IA y desarrolladores frontend.

---

## 1. Vision & Design Aesthetics

La interfaz de usuario sigue un estilo **Premium Technical Minimalist**:
- **Estructura limpia e híper-pulida**: Basada en cuadrículas tipo Bento (Bento Grids) con bordes ultraligeros.
- **Glassmorphism & Filtros Graduales**: Efectos de desfoque de fondo (`backdrop-filter: blur()`), capas translúcidas de elevación y degradados dinámicos.
- **Micro-interacciones**: Transiciones fluidas a 60fps, resplandores al hacer hover (`radial-gradient`), marquees continuos y gráficos interactivos en canvas.
- **Jerarquía Tipográfica**: Combinación de fuentes Sans-Serif modernas para lectura fluida y tipos Mono/Pixel para estética de código y terminal.

---

## 2. Color Palette & Design Tokens

### Colores Base del Lienzo
| Token | Valor CSS / HSL / OKLCH | Uso |
| :--- | :--- | :--- |
| **Canvas Background** | `#F5F4F0` | Fondo general de la aplicación (Warm Light Stone) |
| **Primary Text / Dark** | `#111111` | Títulos principales, textos oscuros, elementos activos |
| **Card Surface Base** | `#FFFFFF` / `#FAFAF8` | Superficie de tarjetas Bento |
| **Card Surface Glass** | `rgba(255, 255, 255, 0.70)` | Fondo translúcido con efecto de vidrio |
| **Subtle Borders** | `rgba(0, 0, 0, 0.06)` a `0.07` | Delimitadores de tarjetas, paneles y barras |

### Colores de Estado y Sintaxis
| Propósito | Hex / RGBA | Uso |
| :--- | :--- | :--- |
| **Success / Online** | `#28a745` / `#16a34a` | Indicadores "En vivo", ejecuciones de tareas, estados passing |
| **Warning / Review** | `#b07d30` / `#facc15` | En revisión, tareas en cola, elementos destacados en ámbar |
| **Purple / Active** | `#8250df` / `#7c3aed` | Fusionado (PRs), palabras clave de lenguaje (TypeScript) |
| **Info / Links** | `#2563eb` / `#60a5fa` | Enlaces a URLs, comandos seleccionados |
| **Destructive / Error**| `#d73a49` | Eliminaciones en diffs, errores |

---

## 3. Typography System

Definida en TailwindCSS v4 vía `@theme inline` en [`app/globals.css`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/globals.css):

```css
@theme inline {
  --font-sans: 'Geist', 'IBM Plex Sans', sans-serif;
  --font-mono: 'Geist Mono', monospace;
  --font-pixel: 'Courier Prime', monospace;
}
```

### Usos Tipográficos Principales
- `font-sans`: Títulos principales (`IBM Plex Sans` font-light, `text-6xl` a `text-8xl`), textos de cuerpo.
- `font-mono`: Terminales, fragmentos de código, código hash de Git, contadores y badges.
- `font-pixel`: Marca principal (`AGENTIC`), identificadores numéricos de pasos (`01`, `02`).

---

## 4. UI Components & Layout Patterns

### A. Bento Card (`BentoCard`)
Contenedor flexible con elevación sutil y efecto de luz de ratón:

```tsx
function BentoCard({ children, className = "", delay = 0 }) {
  return (
    <div
      className={`group relative rounded-2xl border border-black/[0.07] bg-white overflow-hidden transition-all duration-700 hover:border-black/[0.15] hover:bg-[#fafaf8] ${className}`}
    >
      {/* Glow radial al pasar el ratón */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)" }}
      />
      {children}
    </div>
  )
}
```

### B. Pill Tag (`Tag`)
Píldoras para categorizar módulos o secciones:

```tsx
function Tag({ children }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04] uppercase">
      {children}
    </span>
  )
}
```

### C. Navegación Flotante Glass (`MobileNav`)
Barra de navegación fija superior con desenfoque de fondo y selector de idioma dinámico:

```tsx
const NAV_STYLE = {
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  background: "rgba(245,244,240,0.30)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)",
}
```

### D. Filas de Lista Interactiva en Tarjetas (`Card List Row`)
Patrón estándar para tarjetas que contienen listas de elementos, audit logs o indicadores técnicos:

```tsx
<div className="p-6 rounded-2xl border border-black/[0.07] bg-white">
  <div className="text-xs text-black/30 tracking-widest uppercase mb-4">
    {/* Título de la lista */}
  </div>
  <div className="space-y-2">
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
      <span className="text-[10px] text-black/25 font-mono min-w-[60px]">12:34:21</span>
      <span className="text-[11px] text-black/50 font-light flex-1">agent_executed</span>
      <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors" />
    </div>
  </div>
</div>
```

---

## 5. Animations & Keyframes

Definidas en [`app/globals.css`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/globals.css):

### Revelación de Texto (`word-reveal`)
```css
@keyframes word-reveal {
  0% {
    opacity: 0;
    filter: blur(24px);
    transform: translateY(24px);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0px);
  }
}
```

### Carrusel Marquee Continuo (`marqueeLeft` / `marqueeRight`)
```css
@keyframes marqueeLeft {
  from { transform: translateX(0); }
  to   { transform: translateX(-33.333%); }
}
```

---

## 6. Rules for AI Agents Developing UI Components

Al crear o modificar cualquier vista en este proyecto, sigue estrictamente estas reglas:

1. **Usa `useLanguage()`**: Nunca insertes strings de texto en inglés o español quemados en el JSX. Todos los textos deben registrarse en [`lib/translations.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/lib/translations.ts).
2. **Manten el esquema de colores Warm Stone**: Usa `#F5F4F0` para fondos principales y `rgba(0,0,0,0.06)` a `0.07` para bordes finos. Evita colores brillantes chillones o grises fríos predeterminados.
3. **Optimización con `"use client"`**: Si el componente usa hooks de React (`useState`, `useEffect`, `useRef`, `useLanguage`), debe incluir la directiva `"use client"` en la primera línea.
4. **Preserva la suavidad de las transiciones**: Utiliza curvas de animación de aceleración estándar como `cubic-bezier(0.16, 1, 0.3, 1)` para movimientos fluidos.
5. **Validación estricta contra `DESIGN.md`**: Todo lo relacionado con colores, tipografía, espaciado o estructura de tarjetas DEBE ser validado obligatoriamente contra las especificaciones de `DESIGN.md` y los patrones existentes en `app/page.tsx` (ej. filas `flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] border border-black/[0.04]` e indicadores `w-1.5 h-1.5 rounded-full`). Está prohibido inventar o improvisar estilos ad-hoc fuera del sistema de diseño.

