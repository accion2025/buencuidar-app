
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTheProblem() {
    console.log("Searching for appointments by status 'pending'...");

    // 1. Check basic visibility (No joins)
    const { data: simpleApps, error: simpleError } = await supabase
        .from('appointments')
        .select('id, title, status, client_id, caregiver_id')
        .eq('status', 'pending')
        .is('caregiver_id', null);

    if (simpleError) {
        console.error("Simple Query Error:", simpleError.message);
    } else {
        console.log(`Simple query (no joins) found ${simpleApps?.length || 0} apps.`);
        simpleApps?.forEach(a => console.log(`- ${a.title} (${a.id})`));
    }

    // 2. Check if a specific appointment (Prueba 24) exists
    console.log("\nSearching for 'PRUEBA 24' specifically...");
    const { data: testApp } = await supabase
        .from('appointments')
        .select('*')
        .ilike('title', '%PRUEBA 24%');
    console.log(`Search result for 'PRUEBA 24': ${testApp?.length || 0} rows.`);

    // 3. Attempt join
    console.log("\nAttempting query WITH joins (exactly like JobBoard.jsx)...");
    const { data: joinedApps, error: joinError } = await supabase
        .from('appointments')
        .select('*, client:client_id(full_name), patient:patient_id(full_name)')
        .eq('status', 'pending')
        .is('caregiver_id', null);

    if (joinError) {
        console.error("Joined Query Error:", joinError.message);
    } else {
        console.log(`Joined query found ${joinedApps?.length || 0} apps.`);
        joinedApps?.forEach(a => {
            console.log(`- ${a.title}: Client ${a.client?.full_name || 'NULL'}, Patient ${a.patient?.full_name || 'NULL'}`);
        });
    }
}

findTheProblem();
