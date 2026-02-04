
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ntxxknufezprbibzpftf.supabase.co', 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-');

async function activate() {
    console.log('Activating Gerardo Machado...');
    const { data, error } = await supabase
        .from('profiles')
        .update({
            subscription_status: 'active',
            plan_type: 'professional_pro', // High visibility
            role: 'caregiver',
            verification_status: 'verified'
        })
        .eq('email', 'gerardo.machado@outlook.com');

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Updated successfully (profiles)');
    }

    // Try care_details if it exists
    const { error: edError } = await supabase
        .from('caregiver_details')
        .update({ verification_status: 'verified' })
        .eq('id', '64a43d27-d5db-41ba-be49-4319ac2af03e');

    if (edError) console.error('Caregiver details update failed:', edError.message);
}
activate();
