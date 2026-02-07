import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAppointment() {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            title,
            date,
            time,
            end_time,
            status,
            payment_status,
            payment_amount,
            caregiver_id
        `)
        .ilike('title', '%PRUEBA 17%');

    if (error) {
        console.error('Error fetching appointment:', error);
        return;
    }

    console.log('Found appointments:', appointments);
}

inspectAppointment();
