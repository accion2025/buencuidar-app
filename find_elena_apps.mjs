import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findElenaApps() {
    const elenaId = '6422b856-745b-4da3-ac64-1734ec1d2805';
    console.log(`Buscando citas para Elena (${elenaId})...`);

    const { data: apps, error: appErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', elenaId);

    if (appErr) {
        console.error("Error apps:", appErr);
    } else {
        console.log(`Citas encontradas: ${apps.length}`);
        apps.forEach(a => {
            console.log(`- ID: ${a.id} | TITLE: "${a.title}" | DATE: ${a.date} | TYPE: ${a.type} | STATUS: ${a.status}`);
            if (a.type === 'Cuidado+') {
                console.log(`  CARE_AGENDA: ${JSON.stringify(a.care_agenda, null, 2)}`);
                console.log(`  DETAILS: ${a.details}`);
            }
        });
    }
}

findElenaApps();
