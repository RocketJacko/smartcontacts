# Documentación Técnica — Lógica de Disponibilidad Nativa en Supabase PL/pgSQL & Horario Comercial (1:00 PM - 5:30 PM)

## 📋 1. Resumen de la Implementación

Se ha migrado e implementado el 100% de la lógica de disponibilidad del calendario comercial al motor de base de datos **PostgreSQL en Supabase** (`fxhemyrjetpwtmjxmftk`), restringiendo el rango hábil de atención exclusivamente a la tarde de Colombia.

---

## 🕒 2. Reglas de Negocio Comercial (Colombia — `America/Bogota`)

1. **Zona Horaria Oficial**: Colombia (`America/Bogota` / UTC-5).
2. **Horario Hábil Comercial de Atención**:
   * **Exclusivamente de 1:00 PM a 5:30 PM** (Franjas de 1 hora: `01:00 PM`, `02:00 PM`, `03:00 PM`, `04:00 PM`, `05:00 PM`).
3. **Exclusión de Mañanas**:
   * Todas las mañanas (antes de la 1:00 PM) quedan **100% EXCLUIDAS Y OCUPADAS**. No se ofrecen ni muestran como horarios disponibles.
4. **Tardes (1:00 PM a 5:30 PM)**:
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

  -- Fines de semana: Todos los horarios de la tarde ocupados
  IF v_day_of_week = 0 OR v_day_of_week = 6 THEN
    RETURN QUERY VALUES
      ('01:00 PM', 'ocupado', '01:00 PM - 02:00 PM (Fin de semana)'),
      ('02:00 PM', 'ocupado', '02:00 PM - 03:00 PM (Fin de semana)'),
      ('03:00 PM', 'ocupado', '03:00 PM - 04:00 PM (Fin de semana)'),
      ('04:00 PM', 'ocupado', '04:00 PM - 05:00 PM (Fin de semana)'),
      ('05:00 PM', 'ocupado', '05:00 PM - 05:30 PM (Fin de semana)');
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
  WITH slots_def (slot_id, slot_name, slot_label, slot_start_hour) AS (
    VALUES
      (1, '01:00 PM', '01:00 PM - 02:00 PM', 13),
      (2, '02:00 PM', '02:00 PM - 03:00 PM', 14),
      (3, '03:00 PM', '03:00 PM - 04:00 PM', 15),
      (4, '04:00 PM', '04:00 PM - 05:00 PM', 16),
      (5, '05:00 PM', '05:00 PM - 05:30 PM', 17)
  )
  SELECT
    s.slot_name AS slot,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM calendario.eventos e
        WHERE e.inicio::date = p_fecha
          AND extract(hour from e.inicio AT TIME ZONE 'America/Bogota') = s.slot_start_hour
      ) THEN 'ocupado'
      WHEN s.slot_id = v_rand_slot1 OR s.slot_id = v_rand_slot2 THEN 'ocupado'
      ELSE 'disponible'
    END AS status,
    s.slot_label AS label
  FROM slots_def s
  ORDER BY s.slot_id ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper público en esquema public para acceso PostgREST RPC
CREATE OR REPLACE FUNCTION public.obtener_disponibilidad(p_fecha DATE)
RETURNS TABLE (
  slot text,
  status text,
  label text
) AS $$
  SELECT * FROM calendario.obtener_disponibilidad(p_fecha);
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 🔒 4. Resultados de Verificación de la API

Prueba de consulta en PostgreSQL Supabase para la fecha `2026-08-12`:

```json
[
  {"slot": "01:00 PM", "status": "ocupado", "label": "01:00 PM - 02:00 PM"},
  {"slot": "02:00 PM", "status": "disponible", "label": "02:00 PM - 03:00 PM"},
  {"slot": "03:00 PM", "status": "disponible", "label": "03:00 PM - 04:00 PM"},
  {"slot": "04:00 PM", "status": "ocupado", "label": "04:00 PM - 05:00 PM"},
  {"slot": "05:00 PM", "status": "disponible", "label": "05:00 PM - 05:30 PM"}
]
```

Cero horarios matutinos son entregados o permitidos para agendamiento.
