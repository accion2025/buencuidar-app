
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ntxxknufezprbibzpftf.supabase.co', 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-');

async function checkDetails() {
    const { data, error } = await supabase.from('caregiver_details').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log('Empty table or no access');
    }
}
checkDetails();
