
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually read .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
let env = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
            const [key, ...val] = line.split('=');
            if (key) env[key.trim()] = val.join('=').trim();
        }
    });
} catch (e) {
    console.error("Could not read .env file:", e);
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSTICO DE VISIBILIDAD (CLIENTE ANONIMO) ---');
    console.log('URL:', supabaseUrl);

    // 1. Check job_applications existence (Any status)
    const { count, error: countError } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Error counting apps:', countError);
    else console.log('Total job_applications visibles:', count);

    // 2. Check pending applications with details
    // Intentamos ver si hay alguna pendiente, independientemente del usuario
    const { data: apps, error: appsError } = await supabase
        .from('job_applications')
        .select(`
            id, status, caregiver_id, appointment_id,
            appointment:appointment_id(id, title, type, status, client_id)
        `)
        .eq('status', 'pending')
        .limit(10);

    if (appsError) {
        console.error('Error fetching details:', appsError);
    } else {
        console.log('\nMuestra de Postulaciones Pendientes:');
        if (!apps || apps.length === 0) console.log("No se encontraron postulaciones pendientes.");

        apps?.forEach(app => {
            console.log(`- App [${app.id}] Status: ${app.status}`);
            console.log(`  Caregiver ID: ${app.caregiver_id}`);
            console.log(`  Appointment: ${app.appointment ? 'VISIBLE' : 'NULL (Posible bloqueo RLS)'}`);
            if (app.appointment) {
                console.log(`    Title: ${app.appointment.title}`);
                console.log(`    Type: ${app.appointment.type}`);
                console.log(`    Status: ${app.appointment.status}`);
            }
        });
    }
}

diagnose();
