
-- Permitir que usuarios autenticados vean ofertas abiertas (Bolsa de Trabajo)
-- Requisito: status = 'pending' y no tener cuidador asignado
DROP POLICY IF EXISTS "Caregivers can view open jobs" ON appointments;
CREATE POLICY "Caregivers can view open jobs"
ON appointments FOR SELECT
TO authenticated
USING (status = 'pending' AND caregiver_id IS NULL);

-- Asegurar que clientes y cuidadores vean sus propias citas asignadas
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (auth.uid() = client_id OR auth.uid() = caregiver_id);

-- Habilitar RLS si no lo estaba ya (preventivo)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
