
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTemplates() {
    console.log("--- Listing all care_program_templates ---");
    const { data, error } = await supabase
        .from('care_program_templates')
        .select('activity_name, program_id, category');

    if (error) {
        console.error(error);
    } else {
        console.log(`Found ${data.length} templates.`);
        data.forEach(t => console.log(`- ${t.activity_name} (Program: ${t.program_id}, Cat: ${t.category})`));
    }
}

listTemplates();
