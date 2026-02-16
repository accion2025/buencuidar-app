import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCareLogs() {
    console.log(`Buscando registros en care_logs del 2026-02-14 (UTC)...`);

    const { data, error } = await supabase
        .from('care_logs')
        .select('*, appointment:appointment_id(title, date)')
        .gte('created_at', '2026-02-14T00:00:00')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching care logs:', error);
        return;
    }

    console.log(`Se encontraron ${data.length} registros en total.`);
    data.forEach(l => {
        console.log(`[${l.created_at}] Cita: ${l.appointment?.title} (${l.appointment?.date})`);
        console.log(`   Acción: ${l.action}`);
        console.log(`   Detalle: ${l.detail}`);
    });
}

checkCareLogs();
