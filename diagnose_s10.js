const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .ilike('title', '%Servicio 10%')
        .order('date', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    fs.writeFileSync('diagnose_s10.json', JSON.stringify(data, null, 2));
    console.log(`Retrieved ${data.length} appointments for Servicio 10`);
}

inspect();
