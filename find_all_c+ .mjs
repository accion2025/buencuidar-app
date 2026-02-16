import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllCuidadoPlus() {
    console.log("Buscando TODOS los servicios Cuidado+...");

    const { data: apps, error: appErr } = await supabase
        .from('appointments')
        .select(`
            *,
            client:client_id (full_name),
            caregiver:caregiver_id (full_name)
        `)
        .eq('type', 'Cuidado+');

    if (appErr) {
        console.error("Error apps:", appErr);
    } else {
        console.log(`Cuidado+ encontrados: ${apps.length}`);
        apps.forEach(a => {
            console.log(`- ID: ${a.id}`);
            console.log(`  TITLE: "${a.title}"`);
            console.log(`  CLIENT: ${a.client?.full_name}`);
            console.log(`  CAREGIVER: ${a.caregiver?.full_name}`);
            console.log(`  DATE: ${a.date}`);
            console.log(`  DETAILS sample: ${a.details?.substring(0, 100)}...`);
            // console.log(`  CARE_AGENDA: ${JSON.stringify(a.care_agenda, null, 2)}`);
        });
    }
}

findAllCuidadoPlus();
