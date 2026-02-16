
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("--- Checking Cuidado+ Appointments ---");

    // 1. Get all appointments with 'Cuidado' in type OR where type is 'Cuidado+'
    const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select('id, title, type, status, client_id, caregiver_id')
        .ilike('type', '%Cuidado%')
        .order('created_at', { ascending: false })
        .limit(20);

    if (apptError) {
        console.error("Error fetching appointments:", apptError);
        return;
    }

    console.log(`Found ${appts.length} Cuidado+ appointments.`);
    console.table(appts);

    if (appts.length === 0) return;

    const apptIds = appts.map(a => a.id);

    console.log("\n--- Checking Job Applications for these ---");
    const { data: apps, error: appsError } = await supabase
        .from('job_applications')
        .select('id, appointment_id, status, caregiver_id')
        .in('appointment_id', apptIds);

    if (appsError) {
        console.error("Error fetching applications:", appsError);
        return;
    }

    console.log(`Found ${apps.length} applications.`);
    console.table(apps);
}

checkData();
