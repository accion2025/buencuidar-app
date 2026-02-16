import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listRealCategories() {
    console.log("Listando categorías reales de care_program_templates...");

    const { data, error } = await supabase
        .from('care_program_templates')
        .select('category');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const uniqueCategories = [...new Set(data.map(d => d.category))];
    console.log("Categorías encontradas:", uniqueCategories);
}

listRealCategories();
