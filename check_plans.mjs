import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPlans() {
    const { data, error } = await supabase.from('profiles').select('id, plan_type, subscription_status, full_name');
    if (error) {
        console.error(error);
        return;
    }
    console.table(data);
}

checkPlans();
