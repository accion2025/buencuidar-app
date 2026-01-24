
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

async function getColumns() {
    console.log("Fetching first row of profiles...");
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) console.log("Profiles Error:", pError.message);
    else console.log("Profiles Columns:", pData[0] ? Object.keys(pData[0]) : "Empty Table");

    console.log("\nFetching first row of caregiver_details...");
    const { data: cData, error: cError } = await supabase.from('caregiver_details').select('*').limit(1);
    if (cError) console.log("Caregiver Details Error:", cError.message);
    else console.log("Caregiver Details Columns:", cData[0] ? Object.keys(cData[0]) : "Empty Table");
}
getColumns();
