
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('email', 'gerardo.machado@outlook.com')
        .single();

    if (error) {
        console.error('Error finding user:', error.message);
        return;
    }

    console.log('User found:', data);

    // If user is caregiver, ensure they have a subscription
    const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', data.id)
        .single();

    if (subError && subError.code !== 'PGRST116') {
        console.error('Error finding subscription:', subError.message);
        return;
    }

    if (!sub) {
        console.log('No subscription found. Creating one...');
        const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: data.id,
                plan_type: 'active_pro', // or whatever plan name
                status: 'active',
                current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            });

        if (insertError) {
            console.error('Error creating subscription:', insertError.message);
        } else {
            console.log('Subscription created successfully.');
        }
    } else {
        console.log('Subscription already exists:', sub);
        if (sub.status !== 'active') {
            console.log('Activating subscription...');
            await supabase
                .from('subscriptions')
                .update({ status: 'active' })
                .eq('user_id', data.id);
        }
    }
}

checkUser();
