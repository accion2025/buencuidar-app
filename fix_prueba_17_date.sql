-- Fix date for PRUEBA 17
UPDATE public.appointments
SET date = '2026-02-06'
WHERE title ILIKE '%PRUEBA 17%';
