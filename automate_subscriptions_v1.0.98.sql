-- V1.0.98: Automatización de Suscripciones BC PULSO/PRO
-- Este script activa automáticamente un mes de prueba al crear el perfil.

-- 1. Función para manejar la activación automática
CREATE OR REPLACE FUNCTION handle_auto_subscription_activation()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_type TEXT;
    v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Determinar el tipo de plan según el rol
    IF NEW.role = 'family' THEN
        v_plan_type := 'pulso';
    ELSIF NEW.role = 'caregiver' THEN
        v_plan_type := 'monthly';
    ELSE
        -- Para otros roles (admin, etc), asignar basic y salir
        UPDATE public.profiles 
        SET plan_type = 'basic', 
            subscription_status = 'inactive'
        WHERE id = NEW.id;
        RETURN NEW;
    END IF;

    v_period_end := now() + interval '30 days';

    -- A) Insertar en la tabla de suscripciones
    INSERT INTO public.subscriptions (
        user_id,
        status,
        plan_type,
        current_period_end,
        created_at
    ) VALUES (
        NEW.id,
        'active',
        v_plan_type,
        v_period_end,
        now()
    );

    -- B) Actualizar el perfil original con el estatus activo
    -- Nota: Usamos UPDATE directo porque estamos en AFTER INSERT en profiles
    UPDATE public.profiles
    SET plan_type = v_plan_type,
        subscription_status = 'active'
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger
DROP TRIGGER IF EXISTS tr_auto_activate_subscription ON public.profiles;
CREATE TRIGGER tr_auto_activate_subscription
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_auto_subscription_activation();

-- 3. (Opcional) Comentar para trazabilidad
COMMENT ON FUNCTION handle_auto_subscription_activation IS 'Activa automáticamente BC PULSO/PRO por 30 días al crear perfil (V1.0.98)';
