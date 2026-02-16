import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, date, status, type')
        .limit(100);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Titles found (${data.length}):`);
    data.forEach(d => {
        console.log(`- [${d.type}] ${d.title} (${d.date}) status: ${d.status}`);
    });
}

inspect();
