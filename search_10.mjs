import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, type, date, status')
        .ilike('title', '%10%')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.log("Citas encontradas con '10' en el título:");
    data.forEach(d => {
        console.log(`- ID: ${d.id} | Título: ${d.title} | Tipo: ${d.type} | Fecha: ${d.date} | Estado: ${d.status}`);
    });
}

search();
