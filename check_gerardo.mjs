import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkGerardoProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('full_name', 'Gerardo Machado')
        .single();

    if (error) {
        console.error(error);
        return;
    }
    console.log("Gerardo Profile Data:", JSON.stringify(data, null, 2));
}

checkGerardoProfile();
