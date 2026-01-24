import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually read .env to avoid 'dotenv' dependency
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
const supabaseKey = env.VITE_SUPABASE_ANON_KEY; // Use anon key for client-side like ops

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanYamila() {
    console.log('Searching for pending appointments with Yamila...');

    // Find pending appointments where caregiver is Yamila
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id, 
            status, 
            caregiver_id, 
            title,
            caregiver:caregiver_id(full_name)
        `)
        .eq('status', 'pending')
        .not('caregiver_id', 'is', null);

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log('Found pending requests:', appointments.length);

    // Filter locally because we can't easily filter on joined table in one go without intricate syntax
    const yamilaApp = appointments.find(a =>
        a.caregiver?.full_name?.toLowerCase().includes('yamila') ||
        a.caregiver?.full_name?.toLowerCase().includes('lee')
    );

    if (yamilaApp) {
        console.log('Found Yamila appointment:', yamilaApp);

        // Remove caregiver_id to make it an open job again (or delete if prefered)
        // User asked to remove from "requests", so unassigning caregiver is the logical step
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ caregiver_id: null })
            .eq('id', yamilaApp.id);

        if (updateError) console.error('Error cleaning:', updateError);
        else console.log('✅ Successfully removed caregiver from appointment. It should now disappear from requests.');

    } else {
        console.log('Yamila Lee request not found in pending list.');
    }
}

cleanYamila();
