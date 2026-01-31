-- SCRIPT PARA BORRADO TOTAL Y SEGURO DE UN USUARIO (Cascada Manual)
-- Reemplaza el correo abajo con el usuario a borrar

DO $$
DECLARE
    target_email TEXT := 'ivanjesuscrodriguez@gmail.com'; -- <--- CAMBIA ESTO SI ES OTRO
    target_user_id UUID;
BEGIN
    -- 1. Obtener ID del usuario
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Usuario no encontrado: %', target_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Borrando todo el rastro para el usuario: % (ID: %)', target_email, target_user_id;

    -- 2. Borrar Referencias (FKs) en orden

    -- Mensajes (Enviados o Recibidos)
    DELETE FROM public.messages 
    WHERE sender_id = target_user_id OR conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE participant1_id = target_user_id OR participant2_id = target_user_id
    );
    
    -- Conversaciones
    DELETE FROM public.conversations 
    WHERE participant1_id = target_user_id OR participant2_id = target_user_id;

    -- Aplicaciones de Trabajo
    DELETE FROM public.job_applications WHERE caregiver_id = target_user_id;

    -- Bitácora de Cuidados / Care Logs (Evitar FK constraint en users y appointments)
    DELETE FROM public.care_logs WHERE caregiver_id = target_user_id;
    -- También borrar logs de las citas que se van a eliminar (por si acaso no hay CASCADE)
    DELETE FROM public.care_logs WHERE appointment_id IN (
        SELECT id FROM public.appointments WHERE caregiver_id = target_user_id OR client_id = target_user_id
    );

    -- Citas / Appointments (Como cuidador o familia)
    DELETE FROM public.appointments WHERE caregiver_id = target_user_id OR client_id = target_user_id;

    -- Detalles de Cuidador
    DELETE FROM public.caregiver_details WHERE id = target_user_id;

    -- 3. Borrar Perfil Público
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 4. Borrar Usuario de Autenticación (Esto lo borra de Supabase Auth Definitivamente)
    DELETE FROM auth.users WHERE id = target_user_id;

    RAISE NOTICE 'Usuario % eliminado completa y exitosamente.', target_email;
END $$;
