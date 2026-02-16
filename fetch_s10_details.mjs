import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, details, care_agenda')
        .ilike('title', '%Servicio 10%')
        .limit(5);

    if (error) {
        fs.writeFileSync('s10_error.txt', JSON.stringify(error, null, 2));
    } else {
        fs.writeFileSync('s10_data_details.json', JSON.stringify(data, null, 2));
    }
}
check();
