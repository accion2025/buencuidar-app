
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testQueries() {
    console.log("--- Testing Supabase Query Syntax ---");

    // Test 1: Basic Select
    const { data: d1, error: e1 } = await supabase.from('job_applications').select('*').limit(1);
    console.log("1. Basic Select:", e1 ? `ERROR: ${e1.message}` : "OK");

    // Test 2: Embed Appointment using 'appointment_id' (Current code style)
    const { data: d2, error: e2 } = await supabase.from('job_applications').select('*, appointment:appointment_id(*)').limit(1);
    console.log("2. Embed appointment:appointment_id:", e2 ? `ERROR: ${e2.message}` : "OK");

    // Test 3: Embed Appointment using 'appointments' (Standard style)
    const { data: d3, error: e3 } = await supabase.from('job_applications').select('*, appointment:appointments(*)').limit(1);
    console.log("3. Embed appointment:appointments:", e3 ? `ERROR: ${e3.message}` : "OK");

    // Test 4: Embed Caregiver using 'caregiver_id' (Current code style)
    const { data: d4, error: e4 } = await supabase.from('job_applications').select('*, caregiver:caregiver_id(*)').limit(1);
    console.log("4. Embed caregiver:caregiver_id:", e4 ? `ERROR: ${e4.message}` : "OK");

    // Test 5: Embed Caregiver using 'profiles' (Standard style)
    const { data: d5, error: e5 } = await supabase.from('job_applications').select('*, caregiver:profiles(*)').limit(1);
    console.log("5. Embed caregiver:profiles:", e5 ? `ERROR: ${e5.message}` : "OK");
}

testQueries();
