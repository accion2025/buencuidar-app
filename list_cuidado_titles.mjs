import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTitles() {
    const { data, error } = await supabase
        .from('appointments')
        .select('title, type, date')
        .eq('type', 'Cuidado+')
        .limit(100);

    if (error) {
        console.error(error);
        return;
    }

    const uniqueTitles = [...new Set(data.map(d => d.title))];
    console.log("Títulos encontrados en Cuidado+:");
    uniqueTitles.forEach(t => console.log(`- ${t}`));

    if (data.length > 0) {
        console.log("\nEjemplos de fechas:");
        data.slice(0, 5).forEach(d => console.log(`${d.date}: ${d.title}`));
    }
}

listTitles();
