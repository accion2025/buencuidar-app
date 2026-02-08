-- ALERTA: Este script abre la visibilidad para Cuidadores (Authenticated Users)
-- Objetivo: Cumplir la regla de "Visibilidad Total" de la Bolsa de Trabajo.

-- 1. Tabla APPOINTMENTS
DROP POLICY IF EXISTS "Authenticated users can select appointments" ON appointments;
CREATE POLICY "Authenticated users can select appointments" 
ON appointments FOR SELECT 
TO authenticated 
USING (true);

-- 2. Tabla PROFILES (Para ver nombre del cliente)
DROP POLICY IF EXISTS "Authenticated users can select profiles" ON profiles;
CREATE POLICY "Authenticated users can select profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- 3. Tabla PATIENTS (Para ver datos del paciente)
DROP POLICY IF EXISTS "Authenticated users can select patients" ON patients;
CREATE POLICY "Authenticated users can select patients" 
ON patients FOR SELECT 
TO authenticated 
USING (true);
