
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ntxxknufezprbibzpftf.supabase.co', 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-');

async function check() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    console.log(Object.keys(data[0]));
}
check();
