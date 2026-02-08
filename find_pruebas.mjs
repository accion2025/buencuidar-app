
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- BÚSQUEDA GLOBAL DE PRUEBAS ---");

    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, date, time, end_time, status, caregiver_id')
        .ilike('title', '%PRUEBA%');

    if (error) {
        console.error("ERROR:", error.message);
    } else {
        console.log("RESULTADOS:", JSON.stringify(data, null, 2));
    }
}

run();
