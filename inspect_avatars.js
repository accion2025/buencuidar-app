
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAvatars() {
    console.log("--- Inspecting avatar_url in profiles table ---");

    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('role', 'caregiver')
        .limit(10);

    if (error) {
        console.error("Error selecting from profiles:", error);
    } else {
        if (data && data.length > 0) {
            data.forEach(p => {
                console.log(`User: ${p.full_name}, Avatar: ${p.avatar_url}`);
            });
        } else {
            console.log("No caregivers found.");
        }
    }
}

inspectAvatars();
