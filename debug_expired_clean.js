import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugExpired() {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const graceTime = new Date(now.getTime() - 5 * 60 * 1000);
    const currentGraceTimeStr = `${String(graceTime.getHours()).padStart(2, '0')}:${String(graceTime.getMinutes()).padStart(2, '0')}:00`;

    console.log(`Checking for expired appointments at: ${now.toISOString()}`);
    console.log(`Today: ${todayStr}, Grace Time: ${currentGraceTimeStr}`);

    // Check appointments
    const { data: apps, error } = await supabase
        .from('appointments')
        .select('id, title, date, time, end_time, status, caregiver_id')
        .lte('date', todayStr)
        .eq('status', 'pending')
        .is('caregiver_id', null);

    if (error) {
        console.error("Error fetching appointments:", error);
        return;
    }

    console.log(`Found ${apps.length} pending appointments in pool (past or today):`);

    const expired = apps.filter(app => {
        if (app.date < todayStr) return true;
        const endTime = app.end_time || app.time;
        return endTime < currentGraceTimeStr;
    });

    console.log(`Determined ${expired.length} are actually expired based on grace period.`);

    for (const app of expired) {
        const { data: jobApps } = await supabase
            .from('job_applications')
            .select('id, status, created_at')
            .eq('appointment_id', app.id);

        console.log(`- App [${app.id}] "${app.title}" (${app.date} ${app.time}): ${jobApps?.length || 0} applications found.`);
    }
}

debugExpired();
