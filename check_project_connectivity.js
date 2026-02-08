
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProject() {
    console.log("Checking project: " + supabaseUrl);

    const { data, error, count } = await supabase
        .from('profiles')
        .select('id, full_name, role', { count: 'exact' });

    if (error) {
        console.error("Error accessing profiles:", error.message);
    } else {
        console.log(`Found ${count} total profiles in this project.`);
        if (data && data.length > 0) {
            console.log("Sample profiles:");
            data.slice(0, 5).forEach(p => console.log(`- [${p.role}] ${p.full_name}`));
        } else {
            console.log("DANGER: 0 profiles found. This is NOT the right project.");
        }
    }
}

checkProject();
