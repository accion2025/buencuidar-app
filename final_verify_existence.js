
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalCheck() {
    console.log("Fetching ALL appointments to find the missing 2...");
    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, date, status, caregiver_id, client_id');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("The table is COMPLETELY empty.");
    } else {
        console.log(`Found ${data.length} total appointments in the system.`);
        const febApps = data.filter(a => a.date && a.date.includes('2026-02'));
        if (febApps.length > 0) {
            console.log("\n--- February 2026 Appointments ---");
            febApps.forEach(a => {
                console.log(`- [${a.date}] ${a.title} (Status: ${a.status}, Caregiver: ${a.caregiver_id})`);
            });
        } else {
            console.log("No appointments found specifically for February 2026. Listing some recent ones:");
            data.slice(-5).forEach(a => {
                console.log(`- [${a.date}] ${a.title} (Status: ${a.status})`);
            });
        }
    }
}

finalCheck();
