import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findOldestLogs() {
    console.log("Buscando los registros de bitácora más antiguos...");

    const { data: logs, error: logError } = await supabase
        .from('care_logs')
        .select('*, appointment:appointment_id(title, date)')
        .order('created_at', { ascending: true })
        .limit(20);

    if (logError) {
        console.error("Error:", logError);
        return;
    }

    console.log(`Logs encontrados: ${logs.length}`);
    logs.forEach(l => {
        console.log(`- [${l.created_at}] | App: ${l.appointment?.title} (${l.appointment?.date}) | ${l.action}: ${l.detail}`);
    });
}

findOldestLogs();
