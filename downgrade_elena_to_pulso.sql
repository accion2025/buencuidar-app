-- Downgrade de suscripción para Elena Garcia
-- De 'Cuidado+' a 'Pulso' (Premium) para pruebas en V1.0

UPDATE profiles
SET 
  plan_type = 'Pulso',
  subscription_status = 'active'
WHERE email = 'elena.garcia.test.2fo2ya@gmail.com';

-- Verificar el cambio
SELECT id, full_name, email, plan_type, subscription_status 
FROM profiles 
WHERE email = 'elena.garcia.test.2fo2ya@gmail.com';
