# Reglas del Proyecto Agentic (`AGENTS.md`)

## 1. Validación Estricta del Sistema de Diseño (`DESIGN.md`)
- **Validación Obligatoria**: Antes de proponer o aplicar cambios a la interfaz de usuario (colores, fuentes, bordes, layouts o animaciones), se DEBE validar explícitamente el diseño contra [`DESIGN.md`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/DESIGN.md) y los componentes ya construidos en `app/page.tsx`.
- **Prohibido Inventar Estilos**: Queda estrictamente prohibido utilizar colores, bordes o estructuras de tarjetas ad-hoc que no estén definidos en la especificación de diseño.
- **Patrón Estándar de Filas en Tarjetas**: Las tarjetas que presenten listas de información, logs o indicadores deben utilizar estrictamente el patrón:
  ```tsx
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
    <span className="text-[10px] text-black/25 font-mono min-w-[16px]">...</span>
    <span className="text-[11px] text-black/50 font-light flex-1">...</span>
    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors" />
  </div>
  ```

## 2. Internacionalización Obligatoria (`useLanguage()`)
- Todos los textos visibles para el usuario deben provenir de `lib/translations.ts` a través del hook `useLanguage()`.
- Nunca insertar strings hardcoded en inglés o español dentro del JSX.

## 3. Validación Obligatoria de Inteligencia de Negocio (`CONTEXT.md`)
- **Validación Obligatoria de Negocio**: Antes de proponer, diseñar o crear cualquier nueva vista, componente, texto de UI, agente o flujo de trabajo, se DEBE validar estrictamente contra la Inteligencia de Negocio y definición empresarial documentada en [`CONTEXT.md`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/CONTEXT.md).
- **Alineación con la Propuesta de Valor**: Toda funcionalidad debe ser coherente con la promesa de la marca: *"No reemplazamos tu departamento comercial. Creamos una nueva unidad de crecimiento para tu empresa."* y los pilares de la propuesta de valor (consultoría, prospección activa, inteligencia de datos con +200k contactos, agentes de IA/RAG, automatizaciones y software a medida).

