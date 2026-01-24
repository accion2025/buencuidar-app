
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Using key from .env
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
        console.log("Most Recent Appointments:");
        if (apps && apps.length > 0) {
            apps.forEach(app => {
                console.log(`ID: ${app.id}, Date: ${app.date} (Type: ${typeof app.date}), Status: ${app.status}, Caregiver: ${app.caregiver_id}, Client: ${app.client_id}`);
            });
        } else {
            console.log("No appointments found.");
        }
    }

    console.log("\n--- Checking specific date query for > 2026-01-21 ---");
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`Querying for date > ${todayStr}`);

    const { data: future, error: futureError } = await supabase
        .from('appointments')
        .select('*')
        .gt('date', todayStr);

    if (futureError) {
        console.error("Error with GT query:", futureError);
    } else {
        console.log(`Found ${future.length} future appointments matching > ${todayStr}.`);
        future.forEach(f => console.log(` - ${f.date}: ${f.title} (${f.status})`));
    }
}

checkAppointments();
