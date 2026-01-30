
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // OR SERVICE_ROLE_KEY if available for inspection

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { supabaseUrl, supabaseKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRoberto() {
    console.log('Searching for Roberto...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Roberto%');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('No profile found for "Roberto".');
        return;
    }

    console.log('Found Profiles count:', profiles.length);

    for (const p of profiles) {
        console.log(`\n--- Profile: ${p.full_name} (${p.id}) ---`);
        console.log('Role:', p.role);
        console.log('Plan Type:', p.plan_type);

        if (p.role === 'caregiver') {
            const { data: apps, error: appError } = await supabase
                .from('appointments')
                .select('id, status, payment_amount, offered_rate, date, time, end_time, payment_status')
                .eq('caregiver_id', p.id);

            if (appError) console.error('Error fetching apps:', appError);

            console.log(`Total Appointments: ${apps ? apps.length : 0}`);

            if (apps && apps.length > 0) {
                // Filter completed/paid
                const completed = apps.filter(a => a.status === 'completed' || a.status === 'paid');
                console.log(`Completed/Paid Appointments: ${completed.length}`);
                console.log('First 3 Completed:', completed.slice(0, 3));
            }
        }
    }
}

inspectRoberto();
