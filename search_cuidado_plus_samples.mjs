import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchCuidadoPlus() {
    console.log("Buscando ejemplos de citas Cuidado+...");

    const { data: apps, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('type', 'Cuidado+')
        .limit(3);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (apps.length === 0) {
        console.log("No se encontraron citas de tipo Cuidado+.");
        return;
    }

    apps.forEach((app, i) => {
        console.log(`\n--- EJEMPLO ${i + 1} ---`);
        console.log("ID:", app.id);
        console.log("Título:", app.title);
        console.log("Details:", app.details);
        console.log("Care Agenda:", JSON.stringify(app.care_agenda, null, 2));
    });
}

searchCuidadoPlus();
