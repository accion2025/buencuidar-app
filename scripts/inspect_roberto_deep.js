
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getEnv(key) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const lines = envFile.split('\n');
        for (const line of lines) {
            const [k, v] = line.split('=');
            if (k.trim() === key) {
                return v.trim().replace(/"/g, '');
            }
        }
    } catch (err) { }
    return process.env[key];
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

// Using service role if available to bypass RLS and see EVERYTHING
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
    console.log('--- Deep Inspection for Roberto ---');

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Roberto%');

    if (!profiles || profiles.length === 0) {
        console.log('No Roberto found.');
        return;
    }

    const roberto = profiles[0];
    console.log(`User: ${roberto.full_name} (${roberto.id})`);

    // 1. Check Reviews
    const { data: reviews, error: revError } = await supabase
        .from('reviews')
        .select('*')
        .eq('caregiver_id', roberto.id);

    console.log(`\nReviews found: ${reviews ? reviews.length : 0}`);
    if (reviews) console.log(reviews);
    if (revError) console.error('Review Error:', revError);

    // 2. Check Appointments (Any status)
    const { data: apps, error: appError } = await supabase
        .from('appointments')
        .select('id, status, date, payment_status')
        .eq('caregiver_id', roberto.id);

    console.log(`\nAll Appointments found: ${apps ? apps.length : 0}`);
    if (apps && apps.length > 0) console.log(apps);
    if (appError) console.error('App Error:', appError);

    // 3. Check Caregiver Details (rating stored there?)
    const { data: details, error: detError } = await supabase
        .from('caregiver_details')
        .select('*')
        .eq('id', roberto.id); // caregiver_details usually shares ID with profile

    console.log(`\nCaregiver Details:`, details);
    if (detError) console.error('Details Error:', detError);

    // 4. Check Payments/Transactions if table exists? (Schema check implies mostly appointments handle payments)
}

deepInspect();
