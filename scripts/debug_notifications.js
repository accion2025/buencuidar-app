
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

async function findGhostNotifications() {
    console.log("👻 Buscando notificaciones 'fantasmas'...");

    // 1. Obtener todos los usuarios con notificaciones no leídas
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
            id,
            user_id,
            type,
            title,
            message,
            created_at,
            is_read,
            metadata
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error al buscar notificaciones:", error);
        return;
    }

    if (!notifications || notifications.length === 0) {
        console.log("✅ No hay ninguna notificación sin leer en la base de datos.");
    } else {
        console.log(`⚠️ Se encontraron ${notifications.length} notificaciones NO LEÍDAS:`);
        notifications.forEach(n => {
            console.log(`--------------------------------------------------`);
            console.log(`ID: ${n.id}`);
            console.log(`Usuario: ${n.user_id}`);
            console.log(`Tipo: ${n.type}`);
            console.log(`Título: ${n.title}`);
            console.log(`Mensaje: ${n.message}`);
            console.log(`Creada: ${n.created_at}`);
            console.log(`Metadata:`, n.metadata);
        });
    }
}

findGhostNotifications();
