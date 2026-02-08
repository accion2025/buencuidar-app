
import { createClient } from '@supabase/supabase-js';

const url = 'https://ntxxknufezprbibzpftf.supabase.co';
const key = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(url, key);

async function run() {
    console.log("--- TEST LOGIN YAMILA ---");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'yamila.lee.test.2fo2ya@gmail.com',
        password: 'yamila123'
    });

    if (error) {
        console.log("ERROR:", error.message);
    } else {
        console.log("SUCCESS! ID:", data.user.id);
        console.log("Meta:", data.user.user_metadata);
    }
}
run();
