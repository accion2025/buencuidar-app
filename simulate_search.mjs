import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateSearch() {
    console.log('--- Simulating Search with Price <= 170 ---');
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            caregiver_details!inner (
                hourly_rate,
                rating
            )
        `)
        .eq('role', 'caregiver')
        .lte('caregiver_details.hourly_rate', 170)
        .order('rating', { foreignTable: 'caregiver_details', ascending: false, nullsFirst: false });

    if (error) {
        console.error(error);
        return;
    }

    // Process like in Search.jsx
    const formatted = (data || []).map(p => ({
        name: p.full_name,
        price: p.caregiver_details[0]?.hourly_rate,
        rating: p.caregiver_details[0]?.rating
    })).sort((a, b) => b.rating - a.rating);

    console.log('Results (', formatted.length, 'found ):');
    console.table(formatted);
}

simulateSearch();
