import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPrueba17Date() {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            title,
            date,
            time
        `)
        .ilike('title', '%PRUEBA 17%');

    if (error) {
        console.error('Error fetching appointment:', error);
        return;
    }

    if (appointments && appointments.length > 0) {
        console.log('Validating PRUEBA 17 Date:');
        appointments.forEach(app => {
            console.log(`- Title: ${app.title}`);
            console.log(`- Date (raw from DB): ${app.date}`);
            // Check if it matches expected '2026-02-06'
            if (app.date === '2026-02-06') {
                console.log('✅ DATE IS CORRECT: 2026-02-06');
            } else {
                console.error(`❌ DATE IS INCORRECT: ${app.date} (Expected 2026-02-06)`);
            }
        });
    } else {
        console.log('No appointment "PRUEBA 17" found.');
    }
}

verifyPrueba17Date();
