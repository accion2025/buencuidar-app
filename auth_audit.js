
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function authAudit() {
    console.log("Attempting login as elena@email.com...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'elena@email.com',
        password: 'password123'
    });

    if (authError) {
        console.error("Login Failed:", authError.message);
        console.log("Trying elena@test.com...");
        const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
            email: 'elena@test.com',
            password: 'password123'
        });
        if (authError2) {
            console.error("All logins failed. Please provide active credentials for deep audit.");
            return;
        }
    }

    console.log("Login Successful!");

    const { data: apps, error: appError } = await supabase
        .from('appointments')
        .select('id, title, date, status, caregiver_id, client_id')
        .gte('date', '2026-02-01')
        .lte('date', '2026-02-28');

    if (appError) {
        console.error("Query Error (after login):", appError.message);
    } else {
        console.log(`Visible appointments in February (as USER): ${apps?.length || 0}`);
        apps?.forEach(a => {
            console.log(`- [${a.date}] ${a.title} | Status: ${a.status} | Caregiver: ${a.caregiver_id} | Client: ${a.client_id}`);
        });
    }
}

authAudit();
