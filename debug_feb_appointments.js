
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAppointment() {
    console.log("Searching for appointments on 2026-02-10...");
    const { data: apps, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', '2026-02-10');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (apps && apps.length > 0) {
        console.log(`Found ${apps.length} appointments:`);
        apps.forEach(app => {
            console.log(`- ID: ${app.id}, Title: ${app.title}, Status: ${app.status}, Caregiver: ${app.caregiver_id}`);
        });
    } else {
        console.log("No appointments found for 2026-02-10.");

        console.log("\nSearching for ANY February appointments...");
        const { data: allFeb } = await supabase
            .from('appointments')
            .select('id, title, date, status')
            .gte('date', '2026-02-01')
            .lte('date', '2026-02-28');

        if (allFeb && allFeb.length > 0) {
            allFeb.forEach(f => console.log(`- ${f.date}: ${f.title} (${f.status})`));
        } else {
            console.log("No appointments found in Feb 2026.");
        }
    }
}

findAppointment();
