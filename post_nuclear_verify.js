
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalAudit() {
    console.log("--- FINAL AUDIT AFTER NUCLEAR SQL ---");

    // We try to fetch all appointments for February 2026
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', '2026-02-01')
        .lte('date', '2026-02-28');

    if (error) {
        console.error("Query Error:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("DANGER: Still finding ZERO appointments. This suggests:");
        console.log("1. The SQL didn't apply to the production DB at https://ntxxknufezprbibzpftf.supabase.co");
        console.log("2. Or the table being used is different.");
    } else {
        console.log(`SUCCESS! Found ${data.length} appointments in February:`);
        data.forEach(app => {
            console.log(`- [${app.date}] ${app.title} | Status: ${app.status} | Caregiver: ${app.caregiver_id}`);
        });
    }

    // Check specifically for JobBoard compatibility
    const todayStr = '2026-02-08';
    const openJobs = data?.filter(a => a.status === 'pending' && a.caregiver_id === null && a.date >= todayStr);
    console.log(`\nJob Board would show ${openJobs?.length || 0} jobs.`);
}

finalAudit();
