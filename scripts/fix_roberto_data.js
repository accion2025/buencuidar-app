
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// specific helper to read .env since we don't have dotenv package
function getEnv(key) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const lines = envFile.split('\n');
        for (const line of lines) {
            const [k, v] = line.split('=');
            if (k.trim() === key) {
                return v.trim().replace(/"/g, ''); // remove quotes if any
            }
        }
    } catch (err) {
        console.error('Error reading .env:', err.message);
    }
    return process.env[key];
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY'); // Use SERVICE_ROLE if available for bypassing RLS, but ANON might work if policies allow update on self or if we are lucky. 
// Actually, updating OTHER users usually requires service_role or be that user. 
// HACK: I will try to use the VITE_SUPABASE_SERVICE_ROLE_KEY if it exists in .env, otherwise fallback to anon and hope for the best (or fail and tell user).
const serviceRoleKey = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || supabaseKey;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixRoberto() {
    console.log('--- Fixing Roberto Data ---');

    // 1. Find Roberto
    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Roberto%')
        .limit(1);

    if (findError) {
        console.error('Error finding Roberto:', findError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.error('Roberto not found!');
        return;
    }

    const roberto = profiles[0];
    console.log(`Found User: ${roberto.full_name} (${roberto.id})`);
    console.log(`Current Plan: ${roberto.plan_type}`);

    // 2. Update to Premium
    if (roberto.plan_type !== 'premium') {
        process.stdout.write('Updating to PREMIUM...');
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ plan_type: 'premium' })
            .eq('id', roberto.id);

        if (updateError) console.error('FAILED:', updateError);
        else console.log('DONE');
    } else {
        console.log('Already PREMIUM.');
    }

    // 3. Check Data
    const { data: apps, error: appError } = await supabase
        .from('appointments')
        .select('id, status, payment_amount')
        .eq('caregiver_id', roberto.id)
        .or('status.eq.completed,status.eq.paid');

    const hasData = apps && apps.length > 0;
    console.log(`Existing Completed/Paid Appointments: ${apps ? apps.length : 0}`);

    if (!hasData) {
        console.log('Seeding sample data for reports...');

        // Find a client (any client)
        const { data: clients } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'family') // assuming 'family' or 'client' role
            .limit(1);

        const clientId = clients && clients.length > 0 ? clients[0].id : null;

        if (!clientId) {
            console.error('No client found to associate appointments with.');
            return;
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const sampleAppointments = [
            {
                caregiver_id: roberto.id,
                client_id: clientId,
                date: yesterday.toISOString().split('T')[0],
                time: '09:00:00',
                end_time: '17:00:00',
                status: 'paid', // Paid to show in earnings
                payment_status: 'paid',
                payment_amount: 120.00,
                offered_rate: 15.00,
                title: 'Cuidado Diario'
            },
            {
                caregiver_id: roberto.id,
                client_id: clientId,
                date: lastWeek.toISOString().split('T')[0],
                time: '10:00:00',
                end_time: '14:00:00',
                status: 'completed', // Completed but maybe pending payment
                payment_status: 'pending',
                payment_amount: 60.00,
                offered_rate: 15.00,
                title: 'Acompañamiento Médico'
            }
        ];

        const { error: seedError } = await supabase
            .from('appointments')
            .insert(sampleAppointments);

        if (seedError) console.error('Error seeding data:', seedError);
        else console.log('Sample data seeded successfully!');
    } else {
        console.log('Data exists, no seeding needed.');
    }
}

fixRoberto();
