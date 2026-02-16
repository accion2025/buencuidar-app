import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, type, date, status, client_id')
        .order('date', { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    console.log("Últimas 50 citas encontradas:");
    data.forEach(d => {
        console.log(`- ID: ${d.id} | Título: ${d.title} | Tipo: ${d.type} | Fecha: ${d.date} | Status: ${d.status} | Client: ${d.client_id}`);
    });
}

listAll();
