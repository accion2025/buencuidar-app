
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("--- Inspecting caregiver_details table columns ---");

    // We cannot query information_schema directly with supabase-js easily unless we use rpc or if exposed via API
    // Instead, let's try to SELECT one row and see the keys returned

    // Attempt 1: Select * from caregiver_details limit 1
    const { data, error } = await supabase
        .from('caregiver_details')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error selecting from caregiver_details:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Columns found in existing data:");
            console.log(Object.keys(data[0]));
        } else {
            console.log("No data rows found to inspect keys. Table might be empty or RLS is blocking.");
            // If empty, we can try to insert a dummy row to see errors? No, that's risky.
            // Let's assume if we can't see them, we should probably check via SQL if possible, 
            // but since CLI failed, let's rely on what we see.
        }
    }
}

inspectSchema();
