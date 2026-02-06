import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfileSchema() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }
    if (data.length > 0) {
        console.log("Profile Columns:", Object.keys(data[0]));
        console.log("One row data:", data[0]);
    } else {
        console.log("No profiles found.");
    }
}

checkProfileSchema();
