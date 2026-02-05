
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const url = envVars['VITE_SUPABASE_URL'];
const key = envVars['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(url, key);

async function inspectSchema() {
    try {
        console.log("--- Triggering Error on caregiver_details ---");
        const { error: err } = await supabase.from('caregiver_details').select('trigger_error_list_columns');
        if (err) console.log("COLUMN LIST ERROR:", err.message);

        console.log("--- Triggering Error on profiles ---");
        const { error: pErr } = await supabase.from('profiles').select('trigger_error_list_columns');
        if (pErr) console.log("COLUMN LIST ERROR:", pErr.message);
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}
inspectSchema();
