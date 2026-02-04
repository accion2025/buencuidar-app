
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Anon Key from .env
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log('Searching for Gerardo Machado...');

    // Search in profiles
    const { data: user, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('email', 'gerardo.machado@outlook.com')
        .single();

    if (error) {
        console.error('Error finding user:', error.message);
        return;
    }

    console.log('User found:', user);

    if (user.role !== 'caregiver') {
        console.log('User is not a caregiver. Updating role...');
        const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: 'caregiver' })
            .eq('id', user.id);

        if (roleError) {
            console.error('Error updating role:', roleError.message);
        }
    }

    // Check caregiver_details
    const { data: details, error: detailsError } = await supabase
        .from('caregiver_details')
        .select('*')
        .eq('id', user.id)
        .single();

    if (detailsError && detailsError.code !== 'PGRST116') {
        console.error('Error checking caregiver_details:', detailsError.message);
    }

    if (!details) {
        console.log('No caregiver_details found. Creating base details...');
        await supabase.from('caregiver_details').insert({
            id: user.id,
            verification_status: 'verified',
            is_available: true
        });
    }

    // Check subscription
    const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
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
                user_id: user.id,
                plan_type: 'active_pro', // High visibility plan
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
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    plan_type: 'active_pro'
                })
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Error updating subscription:', updateError.message);
            } else {
                console.log('Subscription activated successfully.');
            }
        }
    }
}

checkUser();
