
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditAsCaregiver() {
    console.log("Logging in as caregiver (elena@email.com)...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'elena@email.com',
        password: 'password123'
    });

    if (authError) {
        console.error("Auth Error:", authError.message);
        return;
    }

    const caregiverId = authData.user.id;
    console.log(`Logged in! ID: ${caregiverId}`);

    const todayStr = '2026-02-08'; // Hardcoded for this audit
    const currentTime = '00:00:00';

    console.log("Querying Job Board as Elena...");
    const { data: jobs, error: jobsError } = await supabase
        .from('appointments')
        .select(`
            *,
            client:client_id (
                id,
                full_name,
                subscription_status
            )
        `)
        .eq('status', 'pending')
        .is('caregiver_id', null)
        .or(`date.gt.${todayStr},and(date.eq.${todayStr},time.gte.${currentTime})`);

    if (jobsError) {
        console.error("Query Error:", jobsError.message);
        return;
    }

    console.log(`Elena sees ${jobs?.length || 0} jobs.`);
    if (jobs && jobs.length > 0) {
        jobs.forEach(j => {
            console.log(`- [${j.date}] ${j.title} (Status: ${j.status}, Client: ${j.client?.full_name})`);
        });

        const feb10 = jobs.find(j => j.date === '2026-02-10');
        if (feb10) {
            console.log("✅ THE FEB 10 APPOINTMENT IS VISIBLE TO ELENA.");
        } else {
            console.log("❌ THE FEB 10 APPOINTMENT IS NOT VISIBLE TO ELENA.");
        }
    } else {
        console.log("Empty board.");
    }

    // Check if it exists at all without the caregiver_id=null filter
    console.log("\nQuerying ALL Feb 10 appointments (ignoring caregiver_id)...");
    const { data: allFeb10 } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', '2026-02-10');

    if (allFeb10) {
        allFeb10.forEach(j => {
            console.log(`- ID: ${j.id}, Status: ${j.status}, Caregiver: ${j.caregiver_id}, Client: ${j.client_id}`);
        });
    }
}

auditAsCaregiver();
