import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllReviews() {
    console.log('Checking all reviews globally...');
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*, caregiver:caregiver_id(full_name)');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${reviews.length} reviews:`);
    console.table(reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        caregiver: r.caregiver?.full_name
    })));
}

checkAllReviews();
