# Documentación Técnica — Tratamiento de Datos Personales (Habeas Data Ley 1581/2012) & Guía Explicativa de Cookies

## 📜 1. Autorización de Tratamiento de Datos Personales (Habeas Data)

Se ha implementado el cumplimiento legal de la **Ley 1581 de 2012 de Colombia** en la plataforma **smartcontacts.cloud**:

1. **Casilla de Verificación en Formulario (`components/booking-section.tsx`)**:
   - Antes de enviar el agendamiento, el usuario debe autorizar explícitamente el tratamiento de sus datos personales.
   - Texto normativo: *"Autorizo a Smartcontacts para el tratamiento de mis datos personales y el envío de confirmaciones y comunicaciones relativas a esta reserva según la Ley 1581 de 2012 (Habeas Data) y la Política de Privacidad."*
2. **Almacenamiento de Trazabilidad Legal en Supabase**:
   - Campos añadidos a `calendario.prospectos`:
     - `acepta_tratamiento_datos`: BOOLEAN DEFAULT true.
     - `fecha_aceptacion_datos`: TIMESTAMPTZ DEFAULT NOW().
   - `calendario.crear_agendamiento` RPC almacena automáticamente la fecha, hora e indicador de aceptación en la base de datos PostgreSQL.

---

## 🍪 2. Guía Explicativa de Cookies (¿Qué son, para qué sirven y cómo se usan?)

### A. ¿Qué son las Cookies?
Las **cookies** son pequeños archivos de texto que un sitio web guarda en tu navegador (Chrome, Safari, Edge, Firefox) cuando lo visitas. No contienen virus ni ejecutan programas.

### B. ¿Para qué se solicitan legalmente?
Por normativas globales de privacidad (GDPR, ePrivacy y leyes de protección de datos), los sitios web deben informar con transparencia qué información recuerdan de la navegación del usuario.

### C. ¿Qué hacen las cookies en SmartContacts?
En **smartcontacts.cloud**, se utilizan cookies únicamente para dos propósitos funcionales:
1. **Preferencia de Idioma**: Recordar si seleccionaste Español (`es`) u Inglés (`en`) para que al cambiar de página la plataforma no se reinicie a español.
2. **Sesión de Agendamiento**: Mantener la selección del horario y tema mientras navegas por la página.

---

## 🚀 3. Verificación
- `npm run build` compiló 24 rutas estáticas y dinámicas limpiamente en 3.7s.
- Cambios pusheados a GitHub (`main`, `master` y `feature/nueva-identidad`).
