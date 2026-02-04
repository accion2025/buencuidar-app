
-- 1. Actualizar el perfil principal
UPDATE profiles 
SET 
  subscription_status = 'active',
  plan_type = 'professional_pro', -- El valor que el frontend espera para mostrar "PRO"
  role = 'caregiver',
  verification_status = 'verified'
WHERE email = 'gerardo.machado@outlook.com';

-- 2. Manejar detalles del cuidador (Asegurando código y estado sin depender de ON CONFLICT)
UPDATE caregiver_details 
SET 
    verified = true, 
    caregiver_code = COALESCE(caregiver_code, 'PRO-' || upper(substring(id::text from 1 for 8)))
WHERE id IN (SELECT id FROM profiles WHERE email = 'gerardo.machado@outlook.com');

INSERT INTO caregiver_details (id, verified, caregiver_code)
SELECT id, true, 'PRO-' || upper(substring(id::text from 1 for 8))
FROM profiles
WHERE email = 'gerardo.machado@outlook.com'
AND id NOT IN (SELECT id FROM caregiver_details);

-- 3. Gestionar la suscripción usando un valor permitido en el Check Constraint ('premium')
-- Nota: La tabla subscriptions tiene un CHECK (plan_type IN ('basic', 'premium'))
UPDATE subscriptions 
SET status = 'active', plan_type = 'premium'
WHERE user_id IN (SELECT id FROM profiles WHERE email = 'gerardo.machado@outlook.com');

INSERT INTO subscriptions (user_id, plan_type, status, current_period_end)
SELECT id, 'premium', 'active', NOW() + INTERVAL '1 year'
FROM profiles
WHERE email = 'gerardo.machado@outlook.com'
AND id NOT IN (SELECT user_id FROM subscriptions);
