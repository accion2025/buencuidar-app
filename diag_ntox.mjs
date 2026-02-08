
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntoxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- DIAGNÓSTICO PROYECTO REAL (NTOX) ---");

    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, date, status, caregiver_id')
        .ilike('title', '%PRUEBA 24%');

    if (error) {
        console.error("ERROR SUPABASE:", error);
    } else {
        console.log("RESULTADO PRUEBA 24:", JSON.stringify(data, null, 2));
    }
}

run();
