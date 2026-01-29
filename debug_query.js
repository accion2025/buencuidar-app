const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCaregivers() {
    console.log('Fetching caregivers...');
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            role,
            caregiver_details (
                hourly_rate,
                experience,
                specialization
            )
        `)
        .eq('role', 'caregiver');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found', data.length, 'caregivers:');
    data.forEach(p => {
        const details = Array.isArray(p.caregiver_details) ? p.caregiver_details[0] : p.caregiver_details;
        console.log(`- ${p.full_name}: Rate $${details?.hourly_rate}, Exp: ${details?.experience}, Role: ${p.role}`);
    });
}

checkCaregivers();
