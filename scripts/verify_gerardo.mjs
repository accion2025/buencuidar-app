
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ntxxknufezprbibzpftf.supabase.co', 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-');

async function verify() {
    const { data, error } = await supabase
        .from('profiles')
        .select('email, role, subscription_status, plan_type, verification_status')
        .eq('email', 'gerardo.machado@outlook.com')
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('--- GERARDO STATUS ---');
        console.log(JSON.stringify(data, null, 2));
    }

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', data.id)
        .single();

    console.log('--- SUBSCRIPTION ---');
    console.log(JSON.stringify(sub, null, 2));
}
verify();
