
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackages() {
    console.log("--- Checking PACK Appointments ---");

    // 1. Find appointments with 'PACK' in title
    const { data: appts, error } = await supabase
        .from('appointments')
        .select('id, title, date, type, status, client_id')
        .ilike('title', '%PACK%')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.table(appts);

    if (appts.length === 0) return;

    const ids = appts.map(a => a.id);

    // 2. Find applications for these
    const { data: apps, error: appsError } = await supabase
        .from('job_applications')
        .select(`
            id, 
            status, 
            caregiver_id, 
            appointment_id,
            caregiver:caregiver_id (full_name)
        `)
        .in('appointment_id', ids);

    if (appsError) {
        console.error("Error apps:", appsError);
        return;
    }

    console.log("--- Applications for these PACKs ---");
    console.table(apps);
}

checkPackages();
