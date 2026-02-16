import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

const clientId = '6422b856-745b-4da3-ac64-1734ec1d2885';

async function listApps() {
    console.log(`Listando citas para Elena Gracia (${clientId})...`);

    const { data: apps, error: appError } = await supabase
        .from('appointments')
        .select('id, title, date, type, status')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

    if (appError) {
        console.error("Error:", appError);
        return;
    }

    console.log(`Total citas: ${apps.length}`);
    apps.forEach(a => {
        console.log(`- ${a.date} | ${a.title} | ${a.type} | ${a.status}`);
    });
}

listApps();
