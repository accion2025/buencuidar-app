import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Using the anon key from .env (verified)
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    // We can't directly inspect schema with anon key usually, but we can try to select one row and see the keys returned.
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching one row:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in appointments:', Object.keys(data[0]));
    } else {
        console.log('No rows found, cannot infer columns.');
    }
}

inspectColumns();
