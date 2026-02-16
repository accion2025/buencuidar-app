
import { createClient } from '@supabase/supabase-js';

const url = 'https://ntxxknufezprbibzpftf.supabase.co';
const key = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Using the key from .env directly for this debug script
const supabase = createClient(url, key);

async function inspectSchema() {
    try {
        console.log("--- Inspecting appointments table columns ---");
        const { data, error } = await supabase.from('appointments').select('*').limit(1);
        if (error) {
            console.error("Error fetching appointment:", error);
            // Try to trigger error to see columns
            const { error: colError } = await supabase.from('appointments').select('non_existent_column_to_list_all');
            if (colError) console.log("COLUMN LIST ERROR:", colError.message);
        } else {
            if (data && data.length > 0) {
                console.log("Existing columns:", Object.keys(data[0]).join(', '));
            } else {
                console.log("No data found in appointments table, triggering error to see columns...");
                const { error: colError } = await supabase.from('appointments').select('non_existent_column_to_list_all');
                if (colError) console.log("COLUMN LIST ERROR:", colError.message);
            }
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}
inspectSchema();
