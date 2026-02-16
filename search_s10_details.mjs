import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findService10ByDetails() {
    console.log("Buscando 'Servicio 10' en details...");

    const { data: apps, error: appErr } = await supabase
        .from('appointments')
        .select('*');

    if (appErr) {
        console.error("Error apps:", appErr);
    } else {
        const matches = apps.filter(a =>
            (a.details && a.details.toLowerCase().includes('servicio 10')) ||
            (a.title && a.title.toLowerCase().includes('servicio 10'))
        );

        console.log(`Coincidencias encontradas: ${matches.length}`);
        matches.forEach(a => {
            console.log(`\nID: ${a.id} | TITLE: "${a.title}" | DATE: ${a.date}`);
            console.log(`DETAILS: ${a.details}`);
            console.log(`CARE_AGENDA: ${JSON.stringify(a.care_agenda, null, 2)}`);
        });
    }
}

findService10ByDetails();
