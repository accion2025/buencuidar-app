import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const url = envVars['VITE_SUPABASE_URL'];
const key = envVars['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(url, key);

async function listColumns() {
    const { data, error } = await supabase.from('caregiver_details').select('*').limit(1);
    if (error) {
        console.error("Error fetching caregiver_details:", error);
    } else if (data && data.length > 0) {
        console.log("Existing columns in 'caregiver_details':", Object.keys(data[0]));
    } else {
        console.log("No data found in 'caregiver_details'");
    }
}

listColumns();
