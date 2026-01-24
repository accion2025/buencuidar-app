
import { createClient } from '@supabase/supabase-js';

// Connection details from existing files
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
            // Check for potential role/admin columns
            console.log("Sample Data (Roles/Admin?):", profilesData[0]);
        } else {
            console.log("No data rows found in profiles.");
        }
    }

    console.log("\n--- Inspecting notifications table columns ---");
    const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);

    if (notifError) {
        // Table might not exist
        console.error("Error selecting from notifications:", notifError.message);
    } else {
        if (notifData && notifData.length > 0) {
            console.log("Columns found in notifications:");
            console.log(Object.keys(notifData[0]));
            console.log("Sample Notification:", notifData[0]);
        } else {
            console.log("No data rows found in notifications (Table exists).");
            // Try to deduce generic column info via RPC if available, or just assume standard
        }
    }
}

inspectSchema();
