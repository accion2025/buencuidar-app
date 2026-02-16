import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listCarePrograms() {
    console.log("Consultando categorías (programas) del Asistente Inteligente...");

    const { data, error } = await supabase
        .from('care_programs')
        .select('*')
        .order('name');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`\nProgramas encontrados: ${data.length}`);
    data.forEach(p => {
        console.log(`- ${p.name}: ${p.description}`);
    });
}

listCarePrograms();
