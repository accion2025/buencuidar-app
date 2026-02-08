
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Inspecting appointment date formats...");

    // We try to fetch WITHOUT filters to see if ANYTHING is public or if we get a schema error
    const { data, error } = await supabase
        .from('appointments')
        .select('date')
        .limit(5);

    if (error) {
        console.error("Query Error:", error.message);
        // Try to get column info via error hint
        const { error: schemaError } = await supabase.from('appointments').select('id, created_at, date, client_id');
        if (schemaError) console.log("Schema Context:", schemaError.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Sample Dates:", data.map(d => d.date));
        console.log("Types:", data.map(d => typeof d.date));
    } else {
        console.log("No data returned. RLS might be blocking or table is empty.");
    }
}

check();
