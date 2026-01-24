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
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedOpenJobs() {
    console.log('🌱 Seeding Open Jobs...');

    // Try to login to get a user ID
    let user = null;
    const creds = [
        { email: 'elena@email.com', password: 'password123' },
        { email: 'elena@test.com', password: 'password123' },
        { email: 'admin@admin.com', password: 'password123' },
        { email: 'usuario@email.com', password: 'password123' }
    ];

    for (const cred of creds) {
        process.stdout.write(`Trying auth as ${cred.email}... `);
        const { data, error } = await supabase.auth.signInWithPassword(cred);
        if (!error && data?.user) {
            console.log("✅ Success!");
            user = data.user;
            break;
        } else {
            console.log("❌ Failed.");
        }
    }

    if (!user) {
        console.error("❌ Could not authenticate as any known test user. Aborting seed.");
        // Try to fetch ANY session if by miracle we persisted one? No.
        return;
    }

    console.log(`Using User ID: ${user.id}`);

    const today = new Date();
    const futureDate1 = new Date(today); futureDate1.setDate(today.getDate() + 2);
    const futureDate2 = new Date(today); futureDate2.setDate(today.getDate() + 5);
    const futureDate3 = new Date(today); futureDate3.setDate(today.getDate() + 10);

    const jobs = [
        {
            title: "Cuidado de fin de semana",
            date: futureDate1.toISOString().split('T')[0],
            time: "10:00:00",
            end_time: "18:00:00",
            type: "care",
            status: "pending",
            client_id: user.id,
            caregiver_id: null,
            details: "Se busca cuidador para acompañamiento y preparación de alimentos.",
            offered_rate: "$500 MXN"
        },
        {
            title: "Terapia Física - Rehabilitación",
            date: futureDate2.toISOString().split('T')[0],
            time: "16:00:00",
            end_time: "17:00:00",
            type: "therapy",
            status: "pending",
            client_id: user.id,
            caregiver_id: null,
            details: "Ejercicios de movilidad para adulto mayor.",
            offered_rate: "$350 MXN"
        },
        {
            title: "Acompañamiento Nocturno",
            date: futureDate3.toISOString().split('T')[0],
            time: "20:00:00",
            end_time: "08:00:00",
            type: "care",
            status: "pending",
            client_id: user.id,
            caregiver_id: null,
            details: "Vigilancia nocturna, paciente duerme la mayor parte del tiempo.",
            offered_rate: "$800 MXN"
        }
    ];

    for (const job of jobs) {
        // Upsert based on some unique constraint? No unique on these fields.
        // Just insert.
        const { error } = await supabase.from('appointments').insert([job]);
        if (error) console.error("Error inserting job:", error.message);
        else console.log(`✅ Job created: ${job.title}`);
    }
}

seedOpenJobs();
