import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Sample Appointment Keys:", Object.keys(data[0]));
        console.log("Sample Data:", JSON.stringify(data[0], null, 2));
    } else {
        console.log("No appointments found.");
    }
}

inspect();
