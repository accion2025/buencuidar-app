-- ==============================================================================
-- FIX: Visibilidad de Postulaciones para Clientes (Families)
-- ==============================================================================
-- Problema: Los clientes no pueden ver las postulaciones (job_applications)
-- asociadas a sus propias citas (appointments) debido a una política RLS faltante.
-- ==============================================================================

-- 1. Habilitar RLS en la tabla (por si acaso no lo está)
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas que podrían estar en conflicto o ser incorrectas
DROP POLICY IF EXISTS "Clients can view applications for their appointments" ON job_applications;
DROP POLICY IF EXISTS "Families can view applications for their jobs" ON job_applications;

-- 3. Crear la nueva política correcta
-- Permite SELECT si la cita asociada (appointment_id) pertenece al usuario actual (client_id)
CREATE POLICY "Clients can view applications for their appointments"
ON job_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM appointments
    WHERE appointments.id = job_applications.appointment_id
    AND appointments.client_id = auth.uid()
  )
);

-- 4. Verificación (Opcional - solo para confirmar en la consola)
-- Debería devolver true si la política se creó correctamente
SELECT count(*) > 0 as policy_exists 
FROM pg_policies 
WHERE tablename = 'job_applications' 
AND policyname = 'Clients can view applications for their appointments';
