import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReviews() {
    // Yoel Diaz ID (from previous diagnostic or just search by name)
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').eq('full_name', 'Yoel Diaz');
    const yoelId = profiles?.[0]?.id;

    if (!yoelId) {
        console.log('Yoel Diaz not found');
        return;
    }

    console.log(`Checking reviews for Yoel Diaz (ID: ${yoelId})...`);
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('caregiver_id', yoelId);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${reviews.length} reviews:`);
    console.table(reviews);
}

checkReviews();
