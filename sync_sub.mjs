import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncSubscription() {
    const userId = '64a43d27-d5db-41ba-be49-4319ac2af03e'; // Gerardo Machado

    const { error } = await supabase
        .from('subscriptions')
        .insert({
            user_id: userId,
            status: 'active',
            plan_type: 'premium',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

    if (error) {
        console.error("Error updating subscription:", error);
    } else {
        console.log("Subscription record updated successfully for Gerardo Machado.");
    }
}

syncSubscription();
