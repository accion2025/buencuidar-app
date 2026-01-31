
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    console.log("Checking appointments table columns...");
    const { data, error } = await supabase.from('appointments').select('*').limit(1);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
    } else {
        console.log("Table is empty, cannot deduce columns from row. Trying to insert dummy to fail...");
        // This is a bit hacky, but if table is empty we can't see columns via select *.
        // However, we saw earlier the table has data in `debug_with_creds.js` output ("Found X future appointments").
        console.log("Table appears empty via select * limit 1 (or permissions issue?)");
    }
}

checkColumns();
