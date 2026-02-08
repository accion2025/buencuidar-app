-- RESTAURACIÓN DE POLÍTICAS v1.0.8-ESTABLE
-- Tabla: appointments, profiles, patients
-- Propósito: Garantizar visibilidad total para usuarios autenticados.

-- 1. APPOINTMENTS
DROP POLICY IF EXISTS "Caregivers can view open jobs" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can see appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can update their own appointments" ON appointments;

CREATE POLICY "Authenticated users can see appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (true);

-- 2. PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public can view caregivers" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 3. PATIENTS
DROP POLICY IF EXISTS "Caregivers can view patients for jobs" ON patients;
DROP POLICY IF EXISTS "Authenticated users can see patients" ON patients;

CREATE POLICY "Authenticated users can see patients"
ON public.patients FOR SELECT
TO authenticated
USING (true);

-- Grants Finales
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON patients TO authenticated;

-- Verificar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
