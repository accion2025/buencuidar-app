
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAfterSql() {
    console.log("--- Post-SQL Fix Verification ---");

    // Using a known test user if possible, or just checking public access if any
    // Since the policy is for 'authenticated', we need a session.
    // I'll try to find any appointments first (this might still be 0 if no policy for anon)
    const { data: anonData } = await supabase.from('appointments').select('id').limit(1);
    console.log("Anon access (should be empty if RLS is tight):", anonData?.length || 0);

    console.log("Checking for ANY appointments in February 2026...");
    // If I can't log in, I'll ask the user to check the app, 
    // but I can at least try to fetch with the public key.
    const { data: apps, error } = await supabase
        .from('appointments')
        .select('id, title, date, status')
        .gte('date', '2026-02-01')
        .lte('date', '2026-02-28');

    if (error) {
        console.error("Query Error:", error.message);
    } else {
        console.log(`Visible appointments in February: ${apps?.length || 0}`);
        apps?.forEach(a => console.log(`- [${a.date}] ${a.title} (${a.status})`));
    }
}

verifyAfterSql();
