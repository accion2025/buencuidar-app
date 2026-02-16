
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPackData() {
    console.log("--- Inspecting PACK Appointments ---");

    // Search for appointments with "PACK" in the title
    const { data: appts, error } = await supabase
        .from('appointments')
        .select('*')
        .ilike('title', '%PACK%');

    if (error) {
        console.error("Error fetching appointments:", error);
        return;
    }

    if (appts.length === 0) {
        console.log("No appointments found with 'PACK' in title.");
    } else {
        console.table(appts.map(a => ({
            id: a.id,
            title: a.title,
            type: a.type,        // <--- Critical to check this
            status: a.status,
            client_id: a.client_id
        })));
    }
}

inspectPackData();
