import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSubSchema() {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }
    if (data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
    } else {
        console.log("Table is empty. Checking schema via query...");
        // Fallback or just try a generic insert/select to see what fails
    }
}

checkSubSchema();
