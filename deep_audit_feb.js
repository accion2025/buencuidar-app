
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAudit() {
    console.log("--- DEEP APPOINTMENT AUDIT (FEB 2026) ---");

    // Check for FEBRUARY
    const { data: apps, error } = await supabase
        .from('appointments')
        .select('id, title, date, time, status, caregiver_id, client_id')
        .gte('date', '2026-02-01')
        .lte('date', '2026-02-28');

    if (error) {
        console.error("Query Error:", error.message);
        return;
    }

    if (!apps || apps.length === 0) {
        console.log("CRITICAL: No appointments found at all for Feb 2026 via public API.");
        console.log("Checking for ANY appointments in the whole table...");
        const { data: allApps } = await supabase.from('appointments').select('id, date, status').limit(5);
        console.log(`Table has ${allApps?.length || 0} rows (sample):`);
        allApps?.forEach(a => console.log(`- [${a.date}] ${a.status}`));
    } else {
        console.log(`Found ${apps.length} appointments in February:`);
        apps.forEach(app => {
            console.log(`- ID: ${app.id} | Date: ${app.date} | Status: ${app.status} | Caregiver: ${app.caregiver_id} | Client: ${app.client_id}`);
        });
    }

    // Check specifically for JobBoard visibility logic
    console.log("\n--- SIMULATING JOB BOARD QUERY ---");
    const today = '2026-02-08';
    const { data: jobBoardData, error: jError } = await supabase
        .from('appointments')
        .select('id')
        .eq('status', 'pending')
        .is('caregiver_id', null)
        .gte('date', today);

    if (jError) console.error("Job Board Logic Error:", jError.message);
    else console.log(`Job Board would show ${jobBoardData?.length || 0} jobs using basic status/date filters.`);
}

deepAudit();
