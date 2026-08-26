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

## 4. Idioma Español Obligatorio
- **Español Estricto**: Toda la interacción, respuestas, explicaciones técnicas, planes, documentación y comentarios de código DEBEN ser redactados strictly en idioma ESPAÑOL sin excepciones.

## 5. Organización Estricta de Esquemas en Supabase (`schema.nombre_de_tabla`)
- **Nomenclatura por Esquemas**: Queda estrictamente prohibido crear tablas sueltas en el esquema público por defecto (`public`) cuando correspondan a un sistema o módulo específico.
- **Formato Obligatorio**: Toda nueva tabla en PostgreSQL / Supabase debe pertenecer a su propio esquema correspondiente con la estructura `schema.nombre_de_tabla` (ejemplo: `calendario.prospectos`, `calendario.agendamientos`, `calendario.disponibilidad`).
- **Estructura modular**: Antes de crear tablas, se debe asegurar o ejecutar `CREATE SCHEMA IF NOT EXISTS <nombre_esquema>;`.

## 6. Prohibición Estricta de Credenciales y Secretos Hardcodeados & Documentación en `.env.example`
- **Zero Hardcoded Secrets**: Queda **estrictamente prohibido** escribir llaves de API (`anon_key`, `service_role_key`), contraseñas o tokens secretos como valores de respaldo hardcodeados (fallbacks) dentro del código fuente (ejemplo prohibido: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGci...'`).
- **Uso Exclusivo de Variables de Entorno / Secretos de Supabase**: Todas las credenciales deben consumirse exclusivamente desde las variables de entorno de la plataforma (`process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, `process.env.CHECK_DOMAIN_SECRET`).
- **Documentación Obligatoria en `.env.example`**: Toda variable de entorno nueva o existente DEBE registrarse en el archivo `.env.example` raíz con comentarios explicativos detallados indicando:
  1. Dónde se utiliza en la arquitectura del proyecto (archivos/rutas).
  2. Para qué sirve y por qué es requerida (propósito funcional).
  3. Valores de ejemplo sintácticos sin exponer secretos reales en producción.

## 7. Exclusión Estricta de Esquemas `cobertura` y `dominios` en Estadísticas y Dashboard
- **Prohibido Incluir en Métricas/Estadísticas**: Queda estrictamente prohibido incluir los esquemas o referencias a `cobertura` y `dominios` dentro de los tableros de métricas, estadísticas, gráficos o cuadros de mando (dashboards) de la aplicación.
- **Limpieza del Dashboard**: Los cuadros de mando deben centrarse exclusivamente en las métricas operativas de agendamiento (`calendario`), ejecuciones agénticas de IA, conversiones comerciales y trazabilidad legal de Habeas Data (`calendario.prospectos`).

## 8. Ubicación Oficial de Variables de Entorno en Servidor de Producción Dokploy
- **Ubicación Exclusiva**: Todas las variables de entorno del proyecto (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `CHECK_DOMAIN_SECRET`) residen e inyectan **exclusivamente desde el panel de producción de Dokploy** (`https://smartcontacts.cloud` / Contenedor Docker).
- **Prohibido Pedir Re-Autenticación o Llaves**: Queda estrictamente prohibido asumir falta de credenciales en producción o pedir al usuario que vuelva a ingresar llaves, descargue archivos `credentials.json` o realice inicios de sesión interactivos. Todo el código debe consumir directamente `process.env`.

## 9. Flujo Estricto de Commits y Despliegue Directo en Git (`git push origin main`)
- **Compilación y Verificación Previa**: Antes de finalizar cualquier tarea, se debe ejecutar la validación de tipos `npx tsc --noEmit` para garantizar 0 errores.
- **Commit Estructurado y Push Obligatorio**: Tras realizar y validar cualquier corrección o funcionalidad en el código fuente, se deben confirmar los cambios mediante `git commit -am "fix/feat: descripción"` y enviar de inmediato a producción ejecutando `git push origin main`. Esto garantiza que Dokploy detecte el cambio y compile automáticamente el nuevo contenedor en `smartcontacts.cloud`.
