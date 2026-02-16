import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findService10() {
    console.log("Buscando 'Servicio 10'...");

    // Find appointments for Feb 14, 2026
    const { data: apps, error: appErr } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', '2026-02-14')
        .lte('date', '2026-02-14');

    if (appErr) {
        console.error("Error searching appointments:", appErr);
    } else {
        console.log(`Citas encontradas el 14/02/2026: ${apps.length}`);
        apps.forEach(a => {
            console.log(`- ID: ${a.id} | TITLE: "${a.title}" | TYPE: ${a.type} | STATUS: ${a.status}`);
            if (a.title.includes('Servicio 10') || a.type === 'Cuidado+') {
                console.log(`  CARE_AGENDA: ${JSON.stringify(a.care_agenda, null, 2)}`);
            }
        });
    }

    // Check care_logs regardless of appointment_id if we have Elena's client_id or similar
    // Actually let's search for ANY log on that date
    console.log("\nBuscando registros (care_logs) del 14/02/2026...");
    const { data: logs, error: logErr } = await supabase
        .from('care_logs')
        .select('*')
        .gte('created_at', '2026-02-14')
        .lte('created_at', '2026-02-15');

    if (logErr) {
        console.error("Error searching logs:", logErr);
    } else {
        console.log(`Logs encontrados: ${logs.length}`);
        logs.forEach(l => {
            console.log(`- APP_ID: ${l.appointment_id} | ACTION: "${l.action}" | CAT: ${l.category}`);
        });
    }
}

findService10();
