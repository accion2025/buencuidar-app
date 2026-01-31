-- 1. Agregar columna 'is_banned' a la tabla profiles (si no existe)
-- Esto NO borra ningún dato, solo agrega una "bandera" de estado.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 2. Crear función segura para bloquear/desbloquear (Solo Admins)
create or replace function toggle_user_ban(target_user_id uuid)
returns boolean
language plpgsql
security definer -- Se ejecuta con permisos de superusuario para asegurar el cambio
as $$
declare
    current_status boolean;
    caller_role text;
begin
    -- Verificar que quien llama a la función sea ADMIN
    select role into caller_role from public.profiles where id = auth.uid();
    
    if caller_role != 'admin' then
        raise exception 'Acceso denegado: Solo administradores pueden bloquear usuarios.';
    end if;

    -- Obtener estado actual
    select is_banned into current_status from public.profiles where id = target_user_id;
    
    -- Invertir estado (Toggle)
    update public.profiles 
    set is_banned = not coalesce(current_status, false) -- Si es null, asume false
    where id = target_user_id;

    return not coalesce(current_status, false);
end;
$$;
