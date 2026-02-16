-- Verifica que el trigger se ha actualizado correctamente
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'notify_on_new_application';
