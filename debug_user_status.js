import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugUser() {
    console.log("--- Depurando Estado del Último Usuario ---");
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, subscription_status, plan_type')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
    } else {
        console.log("Perfil encontrado:", data);
        if (data.subscription_status === 'active') {
            console.log("AVISO: El usuario ya tiene una suscripción ACTIVA. El botón NO se mostrará por diseño.");
        } else {
            console.log("El usuario está INACTIVO. El botón DEBERÍA mostrarse.");
        }
    }
}

debugUser();
