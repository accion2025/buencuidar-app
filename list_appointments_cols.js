
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listCols() {
    console.log("Listing columns for 'appointments'...");
    const { error } = await supabase.from('appointments').select('non_existent_column_to_trigger_error');
    if (error) {
        console.log("Error Message (contains columns):", error.message);
    } else {
        console.log("No error? That's unexpected.");
    }
}

listCols();
