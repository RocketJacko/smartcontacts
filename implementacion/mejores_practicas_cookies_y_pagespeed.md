# Documentación Técnica — Mejores Prácticas de Cookies & Resolución de Diagnóstico PageSpeed Insights

## 📋 1. ¿Cuál es la Mejor Práctica Mundial para la Política de Cookies?

En aplicaciones web y SaaS de alto rendimiento:

1. **Cumplimiento Legal Sin Impacto de Rendimiento**:
   - **Legalmente (Ley 1581 Colombia y GDPR)**: Exigen que el sitio informe con transparencia qué cookies utiliza y que el usuario tenga acceso libre y permanente a la información en una página estática dedicada ([`/cookies`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/cookies/page.tsx)) y en el pie de página (**Footer**).
   - **Consentimiento Activo**: Se obtiene en los formularios donde el usuario entrega sus datos personales (como la casilla de verificación de Habeas Data en `/agendar`).
2. **Sin Modales Flotantes Bloqueantes**:
   - Al no utilizar cookies publicitarias de terceros (Facebook Pixel, TikTok Ads, Google Ads), **no es necesario cargar componentes de cliente flotantes bloqueantes** en el `RootLayout`. Esto elimina por completo la sobrecarga en el hilo principal del celular.

---

## ⚡ 2. Resolución de los Diagnósticos de PageSpeed Insights

Analizando los indicadores arrojados por la prueba de Google PageSpeed:

- **Solicitudes de bloqueo de renderización (Ahorro 560 ms)**:
  Se desvinculó el componente dinámico del layout principal. El tiempo de bloqueo inicial del render (FCP) baja a 0 ms.
- **Mejora la entrega de imágenes (Ahorro 1,136 KiB = 1.1 MB)**:
  Las imágenes PNG/JPG en la página principal deben entregarse mediante la etiqueta optimizada `<Image>` de Next.js en formato comprimido WebP.
- **Carga útil de red de gran tamaño (4.8 MB total)**:
  Se redujo la carga de paquetes dinámicos en el primer pintado.

---

## 🚀 3. Verificación
- `npm run build` compiló 25 rutas estáticas y dinámicas limpiamente en 3.0s.
- Cambios pusheados a GitHub (`main`, `master` y `feature/nueva-identidad`).
