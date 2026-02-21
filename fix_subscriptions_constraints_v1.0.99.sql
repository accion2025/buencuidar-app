-- V1.0.99: Corrección de Restricciones para Suscripciones
-- Este script expande los valores permitidos para plan_type y status.

-- 1. Eliminar restricciones antiguas de plan_type
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

-- 2. Añadir nueva restricción con TODOS los tipos de plan requeridos por el sistema
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check 
CHECK (plan_type IN (
    'basic', 
    'premium', 
    'pulso', 
    'plus', 
    'monthly', 
    'annual', 
    'professional_pro', 
    'free', 
    'active_pro'
));

-- 3. Asegurar que la restricción de estatus sea amplia y correcta
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN (
    'active', 
    'past_due', 
    'canceled', 
    'incomplete', 
    'trialing'
));

-- 4. (Opcional) Comentar para trazabilidad
COMMENT ON TABLE public.subscriptions IS 'Tabla de suscripciones con restricciones actualizadas para V1.0.99';
