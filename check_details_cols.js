
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

async function checkDetails() {
    console.log('--- Caregiver Details Audit ---');
    const { data, error } = await supabase.from('caregiver_details').select('*').limit(1);
    if (error) {
        console.log(`❌ Error: ${error.message}`);
    } else {
        console.log(`✅ Columns: ${data[0] ? Object.keys(data[0]).join(', ') : 'Empty table but accessible'}`);
        // If empty, let's try to get columns from information_schema
        const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'caregiver_details' });
        if (cols) console.log('Columns from schema:', cols);
    }
}
checkDetails();
