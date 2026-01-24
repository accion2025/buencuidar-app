
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

async function checkAppointmentsTable() {
    console.log('--- Appointments Table Audit ---');
    const { data, error } = await supabase.from('appointments').select('*').limit(1);

    if (error) {
        console.log(`❌ Error fetching data: ${error.message}`);
        console.log(`Error Details: ${JSON.stringify(error, null, 2)}`);
    } else {
        console.log(`✅ Table accessible.`);
        if (data.length > 0) {
            console.log(`Columns found: ${Object.keys(data[0]).join(', ')}`);
        } else {
            console.log(`No rows yet. This is normal.`);
            // Try to force a schema error to see what PostgREST thinks
            const { error: insertError } = await supabase.from('appointments').insert({ non_existent_column: 'test' });
            console.log('Force Insert Error (to see hint):', insertError?.message);
        }
    }
}
checkAppointmentsTable();
