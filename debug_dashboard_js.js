import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    console.log('--- Debugging Data for Roberto Garcia ---');

    // 1. Get Profile
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
            id, 
            full_name, 
            caregiver_details (
                rating, 
                reviews_count
            )
        `)
        .ilike('full_name', '%Roberto Garcia%');

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.error('No profile found for Roberto Garcia');
        return;
    }

    const roberto = profiles[0];
    console.log('Profile:', JSON.stringify(roberto, null, 2));

    // 2. Get Appointments
    const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('caregiver_id', roberto.id)
        .order('date', { ascending: false });

    if (appError) {
        console.error('Error fetching appointments:', appError);
    } else {
        console.log(`Found ${appointments.length} appointments.`);
        appointments.forEach(app => {
            console.log(`Appointment [${app.date}]: status=${app.status}, payment_status=${app.payment_status}, amount=${app.payment_amount}`);
        });
    }

    // 3. Get Reviews
    const { data: reviews, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('caregiver_id', roberto.id);

    if (reviewError) {
        console.error('Error fetching reviews:', reviewError);
    } else {
        console.log(`Found ${reviews.length} reviews.`);
        reviews.forEach(rev => {
            console.log(`Review [${rev.created_at}]: rating=${rev.rating}, comment=${rev.comment} (AppID: ${rev.appointment_id})`);
        });
    }

    // 4. Verify Trigger Logic check?
    // We can't see triggers from JS client easily, but we can verify data state.
}

debugData();
