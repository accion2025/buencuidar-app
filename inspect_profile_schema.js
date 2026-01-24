
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("--- Inspecting profiles table columns ---");
    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profilesError) {
        console.error("Error selecting from profiles:", profilesError);
    } else {
        if (profilesData && profilesData.length > 0) {
            console.log("Columns found in profiles:");
            console.log(Object.keys(profilesData[0]));
        } else {
            console.log("No data rows found in profiles.");
        }
    }

    console.log("\n--- Inspecting appointments table columns ---");
    const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (apptError) {
        console.error("Error selecting from appointments:", apptError);
    } else {
        if (apptData && apptData.length > 0) {
            console.log("Columns found in appointments:");
            console.log(Object.keys(apptData[0]));
        } else {
            console.log("No data rows found in appointments.");
        }
    }
}

inspectSchema();
