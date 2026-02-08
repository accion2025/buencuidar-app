
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking all appointments (limit 10)...");
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data.length === 0) {
        console.log("No appointments found in the entire table.");
    } else {
        console.log(`Found ${data.length} recent appointments:`, JSON.stringify(data.map(d => ({ id: d.id, title: d.title, date: d.date, status: d.status })), null, 2));
    }
}

check();
