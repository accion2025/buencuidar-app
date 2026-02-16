
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCalendarQuery() {
    console.log("--- Debugging Calendar Query ---");

    // Hardcoded User ID from previous context (Ivan/Elena) - wait, I need the ID.
    // I'll try to find a user ID from the previous `inspect_recent_appointments.js` if it worked, but it didn't.
    // I'll fetch a user ID first by listing profiles if possible, or just standard query.
    // Since I don't have the user's token, I can't simulate the EXACT RLS context.
    // But I can check if the query structure itself is valid publicly or if I can find a user.

    // I'll try to fetch profiles to get a valid ID.
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').limit(1);
    const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

    if (!userId) {
        console.log("Could not find any user to test with.");
        return;
    }
    console.log(`Testing with User ID: ${userId}`);

    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

    console.log(`Querying range: ${firstDay} to ${lastDay}`);

    const startTime = Date.now();
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            caregiver:caregiver_id (
                full_name
            )
        `)
        .or(`client_id.eq.${userId},caregiver_id.eq.${userId}`)
        .gte('date', firstDay.split('T')[0])
        .lte('date', lastDay.split('T')[0]);

    if (error) {
        console.error("Query Error:", error);
    } else {
        console.log(`Query Success! Found ${data.length} appointments.`);
        console.log(`Time taken: ${Date.now() - startTime}ms`);
        if (data.length > 0) console.log("Sample:", data[0]);
    }
}

debugCalendarQuery();
