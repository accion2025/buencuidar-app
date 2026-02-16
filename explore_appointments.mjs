import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointmentTypes() {
    console.log("Explorando tipos de citas y títulos...");

    // 1. Get unique types
    const { data: types, error: typeError } = await supabase
        .from('appointments')
        .select('type');

    if (typeError) {
        console.error("Error fetching types:", typeError);
        return;
    }

    const uniqueTypes = [...new Set(types.map(t => t.type))];
    console.log("Tipos encontrados:", uniqueTypes);

    // 2. Get titles of all appointments from Feb 14
    const { data: apps, error: appError } = await supabase
        .from('appointments')
        .select('title, type, date')
        .eq('date', '2026-02-14');

    if (appError) {
        console.error("Error fetching titles:", appError);
        return;
    }

    console.log(`Citas del 14/02: ${apps.length}`);
    apps.forEach(a => {
        console.log(`- [${a.type}] ${a.title}`);
    });
}

checkAppointmentTypes();
