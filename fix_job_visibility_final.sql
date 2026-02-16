
-- ==============================================================================
-- FIX: Visibilidad de Postulaciones (Job Applications)
-- ==============================================================================
-- Problema: Los clientes no ven las postulaciones a sus citas.
-- Solución: Resetear y aplicar políticas RLS correctas.

-- 1. Habilitar RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas (Borrar todas para evitar conflictos)
DROP POLICY IF EXISTS "Clients can view applications for their appointments" ON job_applications;
DROP POLICY IF EXISTS "Families can view applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Caregivers can view their own applications" ON job_applications;
DROP POLICY IF EXISTS "Caregivers can insert applications" ON job_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON job_applications;

-- 3. Crear Nuevas Políticas

-- A. Clientes (Dueños de la Cita): Pueden VER postulaciones asociadas a sus citas
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

-- B. Cuidadores: Pueden VER sus PROPIAS postulaciones
CREATE POLICY "Caregivers can view their own applications"
ON job_applications
FOR SELECT
USING (
  auth.uid() = caregiver_id
);

-- C. Cuidadores: Pueden CREAR postulaciones (INSERT)
CREATE POLICY "Caregivers can insert applications"
ON job_applications
FOR INSERT
WITH CHECK (
  auth.uid() = caregiver_id
);

-- D. Cuidadores: Pueden ACTUALIZAR sus postulaciones (si es necesario por alguna razón, ej. cancelar)
CREATE POLICY "Caregivers can update their own applications"
ON job_applications
FOR UPDATE
USING (
  auth.uid() = caregiver_id
);

-- Validación final
SELECT count(*) as policies_active FROM pg_policies WHERE tablename = 'job_applications';
