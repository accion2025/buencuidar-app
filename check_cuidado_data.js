
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to load .env
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log("Could not load .env, assuming variables are present or using hardcoded fallback if needed (not recommended)");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("--- Checking Cuidado+ Appointments ---");

    // 1. Get all appointments with 'Cuidado' in type
    const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select('id, title, type, status, client_id, caregiver_id')
        .ilike('type', '%Cuidado%')
        .order('created_at', { ascending: false })
        .limit(10);

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
