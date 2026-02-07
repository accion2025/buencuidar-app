import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAllAppointments() {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            title,
            date,
            time,
            status,
            payment_status,
            payment_amount,
            caregiver_id
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching appointments:', error);
        return;
    }

    console.log('Recent appointments:', JSON.stringify(appointments, null, 2));
}

inspectAllAppointments();
