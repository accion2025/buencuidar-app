
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAppointments() {
    console.log("--- Inspecting Recent Appointments ---");

    // Fetch recent appointments globally (limiting to recent ones to avoid flooding)
    const { data: appts, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching appointments:", error);
        return;
    }

    if (appts.length === 0) {
        console.log("No appointments found.");
    } else {
        console.table(appts.map(a => ({
            id: a.id,
            title: a.title,
            type: a.type,
            status: a.status,
            client_id: a.client_id,
            details: a.details ? a.details.substring(0, 50) + "..." : 'N/A'
        })));

        // Detailed inspect of one "PACK" appointment if found
        const packAppt = appts.find(a => a.title && a.title.includes('PACK'));
        if (packAppt) {
            console.log("\n--- DETAILED PACK APPOINTMENT ---");
            console.log(JSON.stringify(packAppt, null, 2));
        } else {
            console.log("\n--- No 'PACK' appointment found in recent 20. Checking specifically for PACK... ---");
            const { data: packAppts } = await supabase
                .from('appointments')
                .select('*')
                .ilike('title', '%PACK%')
                .limit(1);

            if (packAppts && packAppts.length > 0) {
                console.log(JSON.stringify(packAppts[0], null, 2));
            } else {
                console.log("No 'PACK' appointments found even with specific search.");
            }
        }
    }
}

inspectAppointments();
