# Documentación Técnica — Lógica de Disponibilidad Nativa en Supabase PL/pgSQL & Seguridad RLS

## 📋 1. Resumen de la Implementación

Se ha migrado e implementado el 100% de la lógica de disponibilidad del calendario comercial al motor de base de datos **PostgreSQL en Supabase** (`fxhemyrjetpwtmjxmftk`), eliminando por completo cualquier código mock, arreglos de horas hardcodeadas o funciones aleatorias en el cliente frontend.

---

## 🕒 2. Reglas de Negocio Comercial (Colombia — `America/Bogota`)

1. **Zona Horaria Oficial**: Colombia (`America/Bogota` / UTC-5).
2. **Horario Hábil Comercial de Atención**:
   * Únicamente de **1:00 PM a 5:30 PM** (Citas de 1 hora de duración).
3. **Reglas Estructurales de Ocupación en PL/pgSQL (`obtener_disponibilidad`)**:
   * **Mañanas (8:00 AM a 12:00 PM)**: 100% Ocupadas / No disponibles en todos los días.
   * **Tardes (1:00 PM a 5:30 PM)**: 
     * **2 franjas al día ocupadas aleatoriamente** mediante una función pseudo-aleatoria determinista `(seed = day * 17 + month * 31 + year)` para proyectar el efecto visual de alta demanda y escasez.
     * **Citas reales agendadas**: Cualquier reserva en `calendario.eventos` bloquea inmediatamente su horario correspondiente.
     * **Franjas restantes**: Se entregan como `disponible`.

---

## 🗄️ 3. Función PL/pgSQL en PostgreSQL (`calendario.obtener_disponibilidad`)

```sql
CREATE OR REPLACE FUNCTION calendario.obtener_disponibilidad(p_fecha DATE)
RETURNS TABLE (
  slot text,
  status text,
  label text
) AS $$
DECLARE
  v_day_of_week int;
  v_seed int;
  v_rand_slot1 int;
  v_rand_slot2 int;
BEGIN
  v_day_of_week := extract(dow from p_fecha);

  -- Fines de semana: Todos los horarios ocupados
  IF v_day_of_week = 0 OR v_day_of_week = 6 THEN
    RETURN QUERY VALUES
      ('08:00 AM', 'ocupado', '08:00 AM - 09:00 AM'),
      ('09:00 AM', 'ocupado', '09:00 AM - 10:00 AM'),
      ('10:00 AM', 'ocupado', '10:00 AM - 11:00 AM'),
      ('11:00 AM', 'ocupado', '11:00 AM - 12:00 PM'),
      ('12:00 PM', 'ocupado', '12:00 PM - 01:00 PM'),
      ('01:00 PM', 'ocupado', 'Fin de semana'),
      ('02:00 PM', 'ocupado', 'Fin de semana'),
      ('03:00 PM', 'ocupado', 'Fin de semana'),
      ('04:00 PM', 'ocupado', 'Fin de semana'),
      ('05:00 PM', 'ocupado', 'Fin de semana');
    RETURN;
  END IF;

  -- Semilla determinista para 2 franjas aleatorias en la tarde (1 a 5)
  v_seed := (extract(day from p_fecha)::int * 17 + extract(month from p_fecha)::int * 31 + extract(year from p_fecha)::int);
  v_rand_slot1 := (v_seed % 5) + 1;
  v_rand_slot2 := ((v_seed + 2) % 5) + 1;
  IF v_rand_slot2 = v_rand_slot1 THEN
    v_rand_slot2 := (v_rand_slot1 % 5) + 1;
  END IF;

  RETURN QUERY
  WITH slots_def (slot_id, slot_name, slot_label, slot_start_hour, slot_end_hour, es_manana) AS (
    VALUES
      (1, '08:00 AM', '08:00 AM - 09:00 AM', 8, 9, true),
      (2, '09:00 AM', '09:00 AM - 10:00 AM', 9, 10, true),
      (3, '10:00 AM', '10:00 AM - 11:00 AM', 10, 11, true),
      (4, '11:00 AM', '11:00 AM - 12:00 PM', 11, 12, true),
      (5, '12:00 PM', '12:00 PM - 01:00 PM', 12, 13, true),
      (6, '01:00 PM', '01:00 PM - 02:00 PM', 13, 14, false),
      (7, '02:00 PM', '02:00 PM - 03:00 PM', 14, 15, false),
      (8, '03:00 PM', '03:00 PM - 04:00 PM', 15, 16, false),
      (9, '04:00 PM', '04:00 PM - 05:00 PM', 16, 17, false),
      (10, '05:00 PM', '05:00 PM - 05:30 PM', 17, 18, false)
  )
  SELECT
    s.slot_name AS slot,
    CASE
      WHEN s.es_manana THEN 'ocupado'
      WHEN EXISTS (
        SELECT 1 FROM calendario.eventos e
        WHERE e.inicio::date = p_fecha
          AND extract(hour from e.inicio AT TIME ZONE 'America/Bogota') = s.slot_start_hour
      ) THEN 'ocupado'
      WHEN (s.slot_id - 5) = v_rand_slot1 OR (s.slot_id - 5) = v_rand_slot2 THEN 'ocupado'
      ELSE 'disponible'
    END AS status,
    s.slot_label AS label
  FROM slots_def s
  ORDER BY s.slot_id ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔒 4. Seguridad, Tokens Transaccionales y RLS

### A. Políticas de Seguridad (Row Level Security)
Se activó RLS en las 6 tablas del esquema `calendario`. Ningún cliente anónimo puede listar eventos, prospectos ni usuarios directamente.

```sql
ALTER TABLE calendario.prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario.calendarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario.permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario.excepciones ENABLE ROW LEVEL SECURITY;
```

### B. Tokens Transaccionales Firmados (5 min TTL)
La API Proxy `/api/calendar/availability` firma cada franja disponible con un token HMAC-SHA256 de corta duración:

```json
{
  "slot": "02:00 PM",
  "status": "disponible",
  "label": "02:00 PM - 03:00 PM",
  "bookingToken": "eyJzbG90IjoiMDI6MDAgUE0iLCJkYXRlIjoiMjAyNi0wOC0xMiIsImV4cCI6MTc4NjQzMjEzNH0=|d92a..."
}
```

---

## 🎨 5. Limpieza Total del Frontend ([`components/booking-section.tsx`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/components/booking-section.tsx))

- **Código Basura Eliminado**: Purgados todos los arreglos estáticos `allTimeSlots`, la función pseudo-hash `getSlotOccupancy` y las validaciones locales.
- **Conexión en Vivo**: Al cambiar de día, el componente consulta `/api/calendar/availability?date=YYYY-MM-DD` y renderiza el estado exacto devuelto por PostgreSQL Supabase.
