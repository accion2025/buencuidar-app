
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApplications() {
    console.log('--- Checking Job Applications ---');

    // 1. Fetch all pending applications
    const { data: apps, error } = await supabase
        .from('job_applications')
        .select(`
      id,
      status,
      created_at,
      caregiver_id,
      appointment_id,
      appointment:appointment_id (
        id,
        title,
        status,
        client_id
      )
    `)
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching applications:', error);
        return;
    }

    console.log(`Found ${apps.length} pending applications.`);

    apps.forEach(app => {
        console.log(`App ID: ${app.id}`);
        console.log(`  Status: ${app.status}`);
        console.log(`  Caregiver ID: ${app.caregiver_id}`);
        console.log(`  Appointment: ${app.appointment?.title} (ID: ${app.appointment?.id})`);
        console.log(`  Appt Status: ${app.appointment?.status}`);
        console.log(`  Client ID: ${app.appointment?.client_id}`);
        console.log('---');
    });

    // 2. Check specific appointment "PRUEBA 43" if possible
    console.log('\n--- Checking specific appointment "PRUEBA 43" ---');
    const { data: specificAppt, error: specificError } = await supabase
        .from('appointments')
        .select('id, title, status, client_id')
        .ilike('title', '%PRUEBA 43%')
        .limit(1);

    if (specificError) {
        console.error('Error fetching specific appointment:', specificError);
    } else if (specificAppt && specificAppt.length > 0) {
        const appt = specificAppt[0];
        console.log(`Found Appointment: ${appt.title} (ID: ${appt.id})`);
        console.log(`  Status: ${appt.status}`);
        console.log(`  Client ID: ${appt.client_id}`);

        // Check applications for this specific appointment
        const { data: relatedApps, error: relatedError } = await supabase
            .from('job_applications')
            .select('*')
            .eq('appointment_id', appt.id);

        if (relatedError) {
            console.error('Error fetching related applications:', relatedError);
        } else {
            console.log(`  Related Applications: ${relatedApps.length}`);
            relatedApps.forEach(ra => {
                console.log(`    - App ID: ${ra.id}, Status: ${ra.status}, Caregiver: ${ra.caregiver_id}`);
            });
        }
    } else {
        console.log('Appointment "PRUEBA 43" not found via ilike search.');
    }
}

checkApplications();
