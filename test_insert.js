
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

async function testInsert() {
    console.log("Testing insert with 'experience'...");
    const { error: err1 } = await supabase.from('caregiver_details').insert([{
        id: '00000000-0000-0000-0000-000000000000',
        caregiver_code: 'TEST',
        experience: 5
    }]);
    if (err1) console.log("Insert 'experience' Error:", err1.message);
    else console.log("Insert 'experience' SUCCESS");

    console.log("\nTesting insert with 'experience_years'...");
    const { error: err2 } = await supabase.from('caregiver_details').insert([{
        id: '00000000-0000-0000-0000-000000000000',
        caregiver_code: 'TEST2',
        experience_years: 5
    }]);
    if (err2) console.log("Insert 'experience_years' Error:", err2.message);
    else console.log("Insert 'experience_years' SUCCESS");
}
testInsert();
