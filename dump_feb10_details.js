
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpDetails() {
    console.log("Searching for appointments on 2026-02-10 with full details...");
    const { data: apps, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', '2026-02-10');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (!apps || apps.length === 0) {
        console.log("No appointments found for 2026-02-10 in the public schema.");
        // Try searching for the whole month to see if there's a typo
        const { data: monthApps } = await supabase
            .from('appointments')
            .select('id, title, date, status, caregiver_id')
            .gte('date', '2026-02-01')
            .lte('date', '2026-02-28');

        console.log(`Found ${monthApps?.length || 0} appointments in February.`);
        monthApps?.forEach(a => console.log(`- ${a.date}: [${a.status}] ${a.title} (Caregiver: ${a.caregiver_id})`));
        return;
    }

    apps.forEach(app => {
        console.log("\n--- APPOINTMENT DATA ---");
        console.log(`ID: ${app.id}`);
        console.log(`Title: ${app.title}`);
        console.log(`Date: ${app.date}`);
        console.log(`Time: ${app.time}`);
        console.log(`Status: ${app.status}`);
        console.log(`Client ID: ${app.client_id}`);
        console.log(`Caregiver ID: ${app.caregiver_id}`);
        console.log(`Address: ${app.address}`);
        console.log(`Created At: ${app.created_at}`);
        console.log(`Updated At: ${app.updated_at}`);
        console.log("------------------------\n");
    });
}

dumpDetails();
