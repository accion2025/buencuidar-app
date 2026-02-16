
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findEnglish() {
    console.log("--- Searching for English terms in appointments ---");
    const { data, error } = await supabase
        .from('appointments')
        .select('id, details, care_agenda, title')
        .limit(100);

    if (error) {
        console.error(error);
    } else {
        const matches = data.filter(a =>
            (a.details && a.details.toLowerCase().includes('meal')) ||
            (a.title && a.title.toLowerCase().includes('meal')) ||
            (JSON.stringify(a.care_agenda || {}).toLowerCase().includes('meal'))
        );

        if (matches.length > 0) {
            console.log(`Found ${matches.length} matches:`);
            matches.forEach(m => {
                console.log(`ID: ${m.id}`);
                console.log(`Title: ${m.title}`);
                console.log(`Details: ${m.details}`);
                console.log(`Agenda: ${JSON.stringify(m.care_agenda)}`);
                console.log("---");
            });
        } else {
            console.log("No appointments found with 'meal'.");
        }
    }
}

findEnglish();
