
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Using public key as verified earlier

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeletion() {
    console.log("Starting deletion test...");

    // 1. Need a valid user session (This is hard with just anon key if RLS requires auth)
    // Actually, to test RLS failures from the backend script without a user token is tricky.
    // The previous scripts worked because they might be using a Service Role key or the table is public?
    // Wait, the previous scripts used 'sb_publishable...' which is anon. 
    // If table has RLS, anon key won't work for DELETE usually unless policy allows 'public' role (unlikely).

    // However, I can check if I can 'select' from it first.

    const { data, error } = await supabase.from('job_applications').select('*').limit(5);
    if (error) {
        console.error("Error selecting:", error);
    } else {
        console.log("Can select apps:", data);
    }

    // Since I cannot easily simulate the specific user's token here without asking for it (which I shouldn't),
    // I will try to inspect the policies if possible or just create a new migration to FORCE allow delete for now.

    // But first, let's just checking the table existence and columns again.
}

testDeletion();
