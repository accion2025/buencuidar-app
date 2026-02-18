-- enable_notifications_realtime.sql
-- Objetivo: Habilitar Supabase Realtime para la tabla de notificaciones.

-- 1. Asegurar que la tabla tenga una identidad de réplica para Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 2. Añadir la tabla a la publicación de tiempo real de Supabase
-- Nota: Si la publicación 'supabase_realtime' no existe, esto fallará, 
-- pero usualmente viene por defecto en Supabase.
BEGIN;
  -- Intentar añadir a la publicación si existe
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END
  $$;
COMMIT;
