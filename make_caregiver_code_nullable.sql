-- 🛠️ BuenCuidar - Hacer caregiver_code opcional
-- Al eliminar la generación automática, debemos permitir que esta columna acepte valores NULOS.

ALTER TABLE public.caregiver_details
ALTER COLUMN caregiver_code DROP NOT NULL;

-- Verificamos que se haya aplicado el cambio
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'caregiver_details' AND column_name = 'caregiver_code';
