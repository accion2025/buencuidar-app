import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listCareProgramsDetails() {
    console.log("Consultando detalles de programas...");

    const { data, error } = await supabase
        .from('care_programs')
        .select('id, name, icon_name')
        .order('name');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

listCareProgramsDetails();
