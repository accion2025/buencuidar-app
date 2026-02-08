
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- DIAGNÓSTICO ESM ---");

    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .ilike('title', '%PRUEBA 24%');

    if (error) {
        console.error("ERROR SUPABASE:", error);
    } else {
        console.log("RESULTADO:", JSON.stringify(data, null, 2));
    }

    // Test connection to profiles to check if it's broad
    const { data: profs, error: pErr } = await supabase.from('profiles').select('id').limit(1);
    console.log("Conexión a Profiles:", pErr ? `Error: ${pErr.message}` : "OK");
}

run();
