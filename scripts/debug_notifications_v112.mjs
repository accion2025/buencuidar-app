import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("--- Inspeccionando las 5 citas más recientes ---");
    const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (appError) {
        console.error("Error al obtener las citas:", appError);
        return;
    }

    appointments.forEach(a => {
        console.log(`Cita: [ID: ${a.id}] Título: ${a.title} - Status: ${a.status} - Mod: ${a.modification_seen_by_caregiver} - Updated: ${a.updated_at}`);
    });

    const target = appointments.find(a => a.title.includes('PRUEBA 26') || a.id.startsWith('374be43b'));

    if (target) {
        console.log(`\n--- Analizando objetivo: ${target.title} (${target.id}) ---`);
        console.log("Caregiver ID:", target.caregiver_id);

        console.log("\n--- Buscando notificaciones para este cuidador ---");
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', target.caregiver_id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (notifError) {
            console.error("Error al obtener notificaciones:", notifError);
        } else {
            console.log("Últimas 10 notificaciones:");
            notifications.forEach(n => {
                console.log(`- [${n.created_at}] ${n.title}: ${n.message} (Read: ${n.is_read})`);
            });
        }
    } else {
        console.log("\nNo se encontró el objetivo especificado en las últimas 5 citas.");
    }
}

inspect();
