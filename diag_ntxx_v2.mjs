
import { createClient } from '@supabase/supabase-js';

const url = 'https://ntxxknufezprbibzpftf.supabase.co';
const key = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(url, key);

async function run() {
    console.log("--- TEST NTXX (NODE) ---");

    // Test login
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'yamila.lee.test.2fo2ya@gmail.com',
        password: 'yamila123'
    });

    if (authErr) {
        console.error("AUTH ERROR:", authErr.message);
        return;
    }

    console.log("LOGIN OK. ID:", auth.user.id);

    // Test select profiles
    const { data: prof, error: profErr } = await supabase.from('profiles').select('id').limit(1);
    console.log("PROFILES:", profErr ? "ERROR: " + profErr.message : "OK (" + (prof?.length || 0) + ")");

    // Test select appointments
    const { data: app, error: appErr } = await supabase.from('appointments').select('id, title').limit(5);
    console.log("APPOINTMENTS:", appErr ? "ERROR: " + appErr.message : "OK (" + (app?.length || 0) + ")");
    if (app) console.log("DATA:", JSON.stringify(app, null, 2));
}

run();
