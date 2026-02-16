-- manual_approve_proof.sql
-- Fuerza la aprobación del paquete PRUEBA 43 usando el ID que encontramos
-- Esto arreglará los datos inmediatamente.

DO $$
DECLARE
    v_group_id UUID := '1fe7ac8c-2518-4842-a221-54f30b3e1543';
    v_caregiver_id UUID;
    v_rows INT;
BEGIN
    -- 1. Encontrar al cuidador que se postuló (Carlos Benitez o similar)
    SELECT ja.caregiver_id INTO v_caregiver_id
    FROM job_applications ja
    JOIN appointments a ON a.id = ja.appointment_id
    WHERE a.service_group_id = v_group_id
    LIMIT 1;

    IF v_caregiver_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró postulante para este grupo';
    END IF;

    -- 2. Ejecutar la aprobación manualmente
    UPDATE appointments
    SET status = 'confirmed', caregiver_id = v_caregiver_id, updated_at = NOW()
    WHERE service_group_id = v_group_id;
    
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Citas actualizadas: %', v_rows;

    -- 3. Actualizar postulaciones
    UPDATE job_applications ja
    SET status = 'approved'
    FROM appointments a
    WHERE ja.appointment_id = a.id
    AND a.service_group_id = v_group_id
    AND ja.caregiver_id = v_caregiver_id;

    -- 4. Rechazar otros
    UPDATE job_applications ja
    SET status = 'rejected'
    FROM appointments a
    WHERE ja.appointment_id = a.id
    AND a.service_group_id = v_group_id
    AND ja.caregiver_id <> v_caregiver_id;

END $$;
