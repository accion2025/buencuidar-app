
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointments() {
    console.log("--- Checking 5 most recent appointments ---");
    const { data: apps, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching appointments:", error);
    } else {
        console.log(JSON.stringify(apps, null, 2));
    }

    // Also check one specific date match manually to see format
    console.log("\n--- Checking appointments for > 2026-01-21 ---");
    const todayStr = new Date().toISOString().split('T')[0];
    console.log("Today string:", todayStr);

    const { data: future, error: futureError } = await supabase
        .from('appointments')
        .select('id, date, status, caregiver_id')
        .gt('date', "2026-01-21"); // Hardcoded to match user context roughly

    if (futureError) {
        console.error("Error with GT query:", futureError);
    } else {
        console.log("Found > 2026-01-21:", future);
    }
}

checkAppointments();
