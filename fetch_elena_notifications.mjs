import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

const ELENA_ID = '6422b856-745b-4da3-ac64-1734ec1d2885';

async function getNotifications() {
    console.log(`Buscando notificaciones para Elena Gracia (${ELENA_ID})...`);

    // Fetch notifications from today (2026-02-14)
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', ELENA_ID)
        .gte('created_at', '2026-02-14T00:00:00')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return;
    }

    console.log(`Se encontraron ${data.length} notificaciones para hoy.`);
    data.forEach(n => {
        console.log(`[${n.created_at}] ${n.title}: ${n.message}`);
        if (n.metadata) {
            console.log(`   Metadata:`, JSON.stringify(n.metadata));
        }
    });
}

getNotifications();
