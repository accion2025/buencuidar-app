import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    console.log("--- DEBUG START ---");

    // 1. Check Table Structure/Presence
    const { data: tableCheck, error: tableError } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);

    if (tableError) {
        console.error("TABLE ERROR:", tableError);
    } else {
        console.log("TABLE ACCESS SUCCESS. DATA:", tableCheck);
    }

    // 2. Check Profiles
    const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, plan_type, subscription_status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (profileError) {
        console.error("PROFILE ERROR:", profileError);
    } else {
        console.log("LATEST PROFILE:", profileCheck);
    }

    console.log("--- DEBUG END ---");
}

debug();
