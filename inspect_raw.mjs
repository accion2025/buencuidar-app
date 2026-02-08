
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- INSPECCIÓN CRUDA ---");

    // 1. Listar las últimas 5 citas sin filtros de título
    const { data: lastJobs, error } = await supabase
        .from('appointments')
        .select('id, title, date, status, caregiver_id')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("ERROR SUPABASE:", error);
    } else {
        console.log("ÚLTIMAS 5 CITAS:", JSON.stringify(lastJobs, null, 2));
    }
}

run();
