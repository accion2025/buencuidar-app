
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAccess() {
    console.log("Checking access to care_program_templates...");
    try {
        const { data, error } = await supabase
            .from('care_program_templates')
            .select('count')
            .limit(1);

        if (error) {
            console.error("Error accessing table:", error);
        } else {
            console.log("Success! Data accessed. Count result:", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

checkAccess();
