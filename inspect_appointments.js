
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

async function inspectAppointmentsSchema() {
    try {
        const { error: err } = await supabase.from('appointments').select('non_existent_column_to_trigger_error');
        if (err) {
            console.log("COLUMNS:", err.message);
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}
inspectAppointmentsSchema();
