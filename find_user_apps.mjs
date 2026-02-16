import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findUserAndApps() {
    // 1. Buscar perfiles para identificar al usuario
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', '%Ivan%');

    if (userError) {
        console.error("Error buscando perfil:", userError);
    } else {
        console.log("Perfiles encontrados:");
        users.forEach(u => console.log(`- ${u.id}: ${u.full_name} (${u.email})`));
    }

    if (users && users.length > 0) {
        const userId = users[0].id; // Asumimos el primero

        // 2. Buscar citas de Cuidado+ para este usuario
        const { data: apps, error: appError } = await supabase
            .from('appointments')
            .select('*')
            .eq('client_id', userId)
            .eq('type', 'Cuidado+')
            .order('date', { ascending: true });

        if (appError) {
            console.error("Error buscando citas:", appError);
        } else {
            console.log(`\nCitas encontradas para ${users[0].full_name} (${apps.length}):`);
            apps.forEach(a => console.log(`- ${a.date} | ${a.title} | ${a.status}`));
        }
    }
}

findUserAndApps();
