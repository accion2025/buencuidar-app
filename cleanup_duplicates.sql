
-- cleanup_duplicates.sql
-- Objetivo: Eliminar grupos de servicios 'pending' que son duplicados exactos de grupos 'confirmed'.

DO $$
DECLARE
    r RECORD;
    v_deleted_count INT := 0;
BEGIN
    -- Iterar sobre pares de grupos duplicados (Mismo Título, Mismo Cliente, Mismas Fechas)
    -- Uno confirmado, otro pendiente.
    FOR r IN
        SELECT 
            p.service_group_id as pending_group_id,
            c.service_group_id as confirmed_group_id,
            p.title
        FROM appointments p
        JOIN appointments c ON 
            p.client_id = c.client_id 
            AND p.title = c.title
            AND p.date = c.date
            AND p.time = c.time
        WHERE 
            p.status = 'pending' 
            AND c.status = 'confirmed'
            AND p.service_group_id IS NOT NULL
            AND c.service_group_id IS NOT NULL
            AND p.service_group_id <> c.service_group_id
        GROUP BY p.service_group_id, c.service_group_id, p.title
    LOOP
        RAISE NOTICE 'Eliminando duplicado pendiente: % (ID: %) duplicado de (ID: %)', r.title, r.pending_group_id, r.confirmed_group_id;
        
        -- Eliminar las citas del grupo pendiente
        DELETE FROM appointments 
        WHERE service_group_id = r.pending_group_id;
        
        -- También eliminar solicitudes de empleo asociadas (si las hay, aunque en cascada deberían irse si FK está bien, pero aseguramos)
        -- DELETE FROM job_applications WHERE appointment_id IN (...) -- Si no hay FK cascade
        
        v_deleted_count := v_deleted_count + 1;
    END LOOP;

    RAISE NOTICE 'Limpieza completada. Grupos eliminados: %', v_deleted_count;
END $$;
