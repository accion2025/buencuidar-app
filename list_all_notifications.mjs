import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllNotifications() {
    console.log(`Buscando todas las notificaciones del 2026-02-14 (UTC)...`);

    const { data, error } = await supabase
        .from('notifications')
        .select('*, user:user_id(full_name)')
        .gte('created_at', '2026-02-14T00:00:00')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return;
    }

    console.log(`Se encontraron ${data.length} notificaciones en total.`);
    data.forEach(n => {
        console.log(`[${n.created_at}] Usuario: ${n.user?.full_name || n.user_id}`);
        console.log(`   ${n.title}: ${n.message}`);
    });
}

listAllNotifications();
