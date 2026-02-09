
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyCancelledApps() {
    console.log("🔍 Starting Verification: Cancelled Applications Visibility");

    // 1. Login as Caregiver (Carlos)
    const email = 'carlos.benitez@outlook.com';
    const password = 'zxcv456';

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error("❌ Login Failed:", authError.message);
        return;
    }

    console.log("✅ Logged in as:", authData.user.email);
    const userId = authData.user.id;

    // 2. Fetch My Applications (Mimicking CaregiverOverview.jsx logic)
    // We want to see if 'cancelled' status apps are returned
    const { data: apps, error: fetchError } = await supabase
        .from('job_applications')
        .select(`
      id,
      status,
      created_at,
      appointment:appointment_id (
        title,
        status,
        date
      )
    `)
        .eq('caregiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (fetchError) {
        console.error("❌ Error fetching applications:", fetchError.message);
        return;
    }

    console.log(`📊 Found ${apps.length} applications total.`);

    // 3. Check for 'cancelled' status
    const cancelledApps = apps.filter(app => app.status === 'cancelled');
    const expiredApps = apps.filter(app => app.appointment && app.appointment.status === 'cancelled');

    if (cancelledApps.length > 0) {
        console.log(`✅ Success! Found ${cancelledApps.length} applications with status 'cancelled'.`);
        cancelledApps.forEach(app => {
            console.log(`   - App ID: ${app.id}, Status: ${app.status}, Job: ${app.appointment?.title} (${app.appointment?.date})`);
        });
    } else {
        console.warn("⚠️ No applications with status 'cancelled' found directy.");
    }

    if (expiredApps.length > 0) {
        console.log(`✅ Found ${expiredApps.length} applications linked to CANCELLED appointments.`);
        expiredApps.forEach(app => {
            console.log(`   - App ID: ${app.id}, AppStatus: ${app.status}, JobStatus: ${app.appointment?.status}`);
        });
    }

    // 4. Create a specific test case if none found
    if (cancelledApps.length === 0 && expiredApps.length === 0) {
        console.log("⚠️ No test data found. Creating a test expired application...");
        // We need a job to be expired. This is complex to mock purely via script without admin rights, 
        // but we can try to insert a new appointment and then expire it if RLS allows or we use public methods.
        // For now, let's just report the findings.
    }

}

verifyCancelledApps();
