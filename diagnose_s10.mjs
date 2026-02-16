import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .filter('type', 'eq', 'Cuidado+')
        .order('date', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const filtered = (data || []).filter(d => d.title && d.title.toLowerCase().includes('servicio 10'));

    fs.writeFileSync('diagnose_s10.json', JSON.stringify(filtered, null, 2));
    console.log(`Retrieved ${filtered.length} appointments for Servicio 10`);
    if (filtered.length > 0) {
        filtered.slice(0, 5).forEach(f => {
            console.log(`- ${f.title} on ${f.date} at ${f.time} (${f.status}) ID: ${f.id}`);
        });
    }
}

inspect();
