
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
    console.log("--- Checking ALL Appointments Types ---");

    const { data: appts, error } = await supabase
        .from('appointments')
        .select('id, title, type, status, client_id')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error:", error);
    } else {
        console.table(appts);

        // Count by type
        const counts = {};
        appts.forEach(a => {
            counts[a.type] = (counts[a.type] || 0) + 1;
        });
        console.log("Counts by type:", counts);
    }
}

checkAll();
