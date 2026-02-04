-- 🛠️ BuenCuidar - Utilidad para Cambiar Rol de Usuario
-- Ejecuta este script en el SQL EDITOR de Supabase.

-- 1. Función para cambiar el rol de manera segura
CREATE OR REPLACE FUNCTION public.change_user_role(
    target_email TEXT,
    new_role TEXT
)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    old_role TEXT;
BEGIN
    -- Validar roles permitidos
    IF new_role NOT IN ('admin', 'caregiver', 'family') THEN
        RAISE EXCEPTION 'Rol inválido. Roles permitidos: admin, caregiver, family';
    END IF;

    -- Obtener ID del usuario
    SELECT id, role INTO user_id, old_role
    FROM public.profiles
    WHERE email = target_email;

    IF user_id IS NULL THEN
        RETURN 'Usuario no encontrado: ' || target_email;
    END IF;

    -- 1. Actualizar tabla profiles
    UPDATE public.profiles
    SET role = new_role,
        updated_at = NOW()
    WHERE id = user_id;

    -- 2. Actualizar metadatos de auth.users (Para mantener consistencia en sesiones futuras)
    -- Nota: Esto requiere privilegios de superusuario o admin en Supabase.
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
    WHERE id = user_id;

    -- 3. Lógica específica por rol
    IF new_role = 'caregiver' AND old_role != 'caregiver' THEN
        -- Si pasa a ser cuidador, aseguramos que tenga entrada en caregiver_details
        INSERT INTO public.caregiver_details (id, bio, specialization, experience)
        VALUES (user_id, 'Nuevo cuidador asignado manualmente', 'Acompañamiento Integral', 0)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Opcional: Si deja de ser cuidador, ¿borramos details? 
    -- Por seguridad de datos, mejor NO borramos automáticamente. 
    
    RETURN 'Rol actualizado exitosamente de ' || old_role || ' a ' || new_role || ' para ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de uso
COMMENT ON FUNCTION public.change_user_role(TEXT, TEXT) IS 'Cambia el rol de un usuario por email. Uso: SELECT change_user_role(''correo@ejemplo.com'', ''admin'');';

-- EJEMPLO DE USO (Descomenta y cambia el email para probar):
-- SELECT public.change_user_role('tu_correo@ejemplo.com', 'admin');
