
-- 1. Habilitar seguridad (por si acaso no está)
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_details ENABLE ROW LEVEL SECURITY;

-- 2. Permitir ver la tabla base 'caregivers' (Nombre, Avatar, etc.)
-- Nota: Usamos 'TRUE' para desbloquear rápido. En producción se puede restringir más.
CREATE POLICY "Permitir ver cuidadores a usuarios autenticados"
ON caregivers FOR SELECT
TO authenticated
USING (true);

-- 3. Permitir ver detalles (Rating, Experiencia)
CREATE POLICY "Permitir ver detalles a usuarios autenticados"
ON caregiver_details FOR SELECT
TO authenticated
USING (true);
