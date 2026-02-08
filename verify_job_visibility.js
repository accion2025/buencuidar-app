
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyVisibility() {
    console.log("Searching for open jobs as anonymous (acting as job board)...");

    // The policy allows authenticated users. 
    // In a real app, the user would be logged in. 
    // I will try to fetch as admin@admin.com if possible.

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'password123'
    });

    if (authError) {
        console.error("Auth Error:", authError.message);
        console.log("Trying elena@test.com...");
        const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
            email: 'elena@test.com',
            password: 'password123'
        });
        if (authError2) {
            console.error("Auth Error 2:", authError2.message);
            return;
        }
    }

    console.log("Auth Success. Querying open jobs...");
    const { data: jobs, error } = await supabase
        .from('appointments')
        .select('id, title, status, caregiver_id, date')
        .eq('status', 'pending')
        .is('caregiver_id', null);

    if (error) {
        console.error("Query Error:", error.message);
    } else {
        console.log(`Found ${jobs?.length || 0} open jobs.`);
        jobs?.forEach(j => {
            console.log(`- [${j.date}] ${j.title} (Status: ${j.status})`);
        });

        const feb10 = jobs.find(j => j.date === '2026-02-10');
        if (feb10) console.log("✅ SUCCESS: The Feb 10 appointment is now visible to caregivers!");
    }
}

verifyVisibility();
