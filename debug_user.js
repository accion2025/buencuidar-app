
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

async function checkUser() {
    // 1. Get user ID from Auth (we can't query auth.users directly with client usually, 
    // unless we use the service_role key, but we assume we only have anon).
    // Actually, we can't find the user by email with anon key usually. 
    // BUT we can try to query profiles filtering by email if RLS allows it or testing inserts.

    // Attempting to list all profiles first to see if she is there
    const emailToFind = 'natalia.boo.test.2fo2ya@gmail.com';

    console.log(`Searching for profile with email: ${emailToFind}`);

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailToFind);

    if (error) {
        console.error("Error querying profiles:", error);
    } else {
        console.log("Profiles found:", profiles);
        if (profiles.length === 0) {
            console.log("CRITICAL: User not found in 'public.profiles'. This explains the empty dashboard.");
        } else {
            console.log("User found in profiles. Checking details...");
            const userId = profiles[0].id;
            const { data: details } = await supabase
                .from('caregiver_details')
                .select('*')
                .eq('id', userId);
            console.log("Caregiver Details:", details);
        }
    }
}

checkUser();
